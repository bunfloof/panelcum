<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Pterodactyl\Transformers\Api\Client\AllocationTransformer;

class SubdomainsController extends ClientApiController
{
    public function getAllAllocations(Server $server): array
    {
        return $this->fractal->collection($server->allocations)
            ->transformWith($this->getTransformer(AllocationTransformer::class))
            ->toArray();
    }


    public function getAllSubdomains(Server $server)
    {

        // Connect to the database using PDO
        $host = env('SUBDOMAIN_DATABASE_HOST');
        $port = env('SUBDOMAIN_DATABASE_PORT');
        $user = env('SUBDOMAIN_DATABASE_USER');
        $password = env('SUBDOMAIN_DATABASE_PASSWORD');
        $dbname = env('SUBDOMAIN_DATABASE_NAME');
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
    
        try {
            $pdo = new \PDO($dsn, $user, $password);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        } catch (\PDOException $e) {
            return response()->json(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
        }
    
        // Prepare and execute the statement to fetch subdomains
        $stmt = $pdo->prepare("SELECT id, server_uuid, selectedname, selectedzone, selectedrecordtype, selectedproxystatus, selectedttl, selectedip, selectedport, created_at, updated_at FROM subdomains WHERE server_uuid = ?");
        $stmt->execute([$server->uuid]);
    
        // Fetch the results as an associative array
        $subdomains = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    
        return response()->json($subdomains);
    }

    public function createSubdomain(Server $server, Request $request)
    {
        $request->validate([
            'selectedname' => 'required|string',
            'selectedzone' => 'required|string',
            'selectedip' => 'required|string',
            'selectedport' => 'required|integer',
        ]);
        $selectedname = $request->input('selectedname');
        $selectedzone = $request->input('selectedzone');
        $selectedip = $request->input('selectedip');
        $selectedport = $request->input('selectedport');

        // Compare selectedip against the server's allocation IP to prevent exploit

        $allocations = $this->getAllAllocations($server)['data'];

        if (!array_filter($allocations, fn($allocation) => $selectedip == $allocation['attributes']['ip'] && $selectedport == $allocation['attributes']['port'])) {
            return response()->json([
                'error' => 'The selected IP does not match the server\'s allocated IP or port.',
            ], 400); // 400 Bad Request status code
        }
        
        
        //============================================================================= //
        // START of Connect to the coems remote SQL and check for duplicates
        //============================================================================= //
        // Connect to the database using PDO
        $host = env('SUBDOMAIN_DATABASE_HOST');
        $port = env('SUBDOMAIN_DATABASE_PORT');
        $user = env('SUBDOMAIN_DATABASE_USER');
        $password = env('SUBDOMAIN_DATABASE_PASSWORD');
        $dbname = env('SUBDOMAIN_DATABASE_NAME');
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
        
        try {
            $pdo = new \PDO($dsn, $user, $password);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        } catch (\PDOException $e) {
            return response()->json(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
        }

        // Check if the table exists, if not create it
        $query = "CREATE TABLE IF NOT EXISTS subdomains (
            id INT PRIMARY KEY AUTO_INCREMENT,
            server_uuid VARCHAR(255),
            selectedname VARCHAR(255),
            selectedzone VARCHAR(255),
            selectedrecordtype VARCHAR(255),
            selectedproxystatus VARCHAR(255),
            selectedttl VARCHAR(255),
            selectedip VARCHAR(255),
            selectedport INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE (selectedname, selectedzone)
        )";
        $pdo->exec($query);

        // Check for duplicates
        $stmt = $pdo->prepare("SELECT * FROM subdomains WHERE selectedname = ? AND selectedzone = ?");
        $stmt->execute([$selectedname, $selectedzone]);
        if ($stmt->fetch()) {
            return response()->json(['error' => 'The SRV record already exists in the database.'], 400);
        }
        //============================================================================= //
        // END of Connect to the coems remote SQL and check for duplicates
        //============================================================================= //

        // Compare shared selectedip against the server's resolved FQDN
        if ($selectedip != gethostbyname($server->node->fqdn) && ($selectedport != 25565 && $selectedport != 19132)) {
            return response()->json([
                'error' => 'The shared selected IP does not match the resolved IP of the server\'s FQDN.',
            ], 200); // Return a 400 Bad Request status code
        }

        // START of For dedicated IPs
        function updateARecord($selectedzone, $selectedname, $selectedip, $server, $pdo, $serial, $retryCount = 0) {
            // Build the add parameter
            $data = [
                'serial' => $serial,
                'zone' => $selectedzone,
                'add' => json_encode([
                    'dname' => $selectedname,
                    'ttl' => 14400,
                    'record_type' => 'A',
                    'data' => [$selectedip]
                ])
            ];
        
            // Prepare the cPanel endpoint and parameters
            $url = env('CPANEL_URL') . ':' . env('CPANEL_PORT') . '/execute/DNS/mass_edit_zone';
        
            $client = new Client();
        
            // Send the POST request
            $response = $client->post($url, [
                'headers' => [
                    'Authorization' => env('CPANEL_AUTHORIZATION_VALUE'),
                    'Content-Type' => 'application/json',
                ],
                'json' => $data,
            ]);
        
            // Decode the response
            $responseData = json_decode((string)$response->getBody(), true);
        
            // Check if there are errors and if the specific error message is present
            if (isset($responseData['errors']) && $retryCount < 3) {
                foreach ($responseData['errors'] as $error) {
                    if (preg_match('/\((\d+)\) does not match the DNS zone’s serial number \((\d+)\)/', $error, $matches)) {
                        // Found serial in error message, retry with it
                        return updateARecord($selectedzone, $selectedname, $selectedip, $server, $pdo, $matches[2], $retryCount + 1);
                    }
                }
            }
        
            // Insert the record into the database
            $query = "INSERT INTO subdomains (server_uuid, selectedname, selectedzone, selectedrecordtype, selectedproxystatus, selectedttl, selectedip, selectedport) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$server->uuid, $selectedname, $selectedzone, "A", "DNS", "14400", $selectedip, 25565]);
        
            // Return the response from the cPanel API
            return response()->json([
                'result' => $responseData,
            ], 200);
        }
        
        if ($selectedport == 25565 || $selectedport == 19132) {
            //$soaRecord = dns_get_record($selectedzone, DNS_SOA);
            $serial = "1337"; // Simulated wrong serial
        
            if ($serial !== null) {
                return updateARecord($selectedzone, $selectedname, $selectedip, $server, $pdo, $serial);
            }
        
            return response()->json([
                'error' => 'dedicated selectedip',
            ], 200); // Return a 400 Bad Request status code
        }
        
        // END of For dedicated IPs

        // START of For shared IPs //
        // Contact cPanel API and create SRV record with the FQDN as the target
        function updateSRVRecord($selectedzone, $selectedname, $selectedport, $server, $pdo, $selectedip, $serial, $retryCount = 0) {
            // Build the add parameter
            $data = [
                'serial' => $serial,
                'zone' => $selectedzone,
                'add' => json_encode([
                    'dname' => '_minecraft._tcp.' . $selectedname,
                    'ttl' => 14400,
                    'record_type' => 'SRV',
                    'data' => ['0', '0', $selectedport, $server->node->fqdn]
                ])
            ];
            
            // Prepare the cPanel endpoint and parameters
            $url = env('CPANEL_URL') . ':' . env('CPANEL_PORT') . '/execute/DNS/mass_edit_zone';
        
            $client = new Client();
        
            // Send the POST request
            $response = $client->post($url, [
                'headers' => [
                    'Authorization' => env('CPANEL_AUTHORIZATION_VALUE'),
                    'Content-Type' => 'application/json',
                ],
                'json' => $data,
            ]);
        
            // Decode the response
            $responseData = json_decode((string)$response->getBody(), true);
            
            // Check if there are errors and if the specific error message is present
            if (isset($responseData['errors']) && $retryCount < 3) {
                foreach ($responseData['errors'] as $error) {
                    if (preg_match('/\((\d+)\) does not match the DNS zone’s serial number \((\d+)\)/', $error, $matches)) {
                        // Found serial in error message, retry with it
                        return updateSRVRecord($selectedzone, $selectedname, $selectedport, $server, $pdo, $selectedip, $matches[2], $retryCount + 1);
                    }
                }
            }
            // Insert the record into the database
            $query = "INSERT INTO subdomains (server_uuid, selectedname, selectedzone, selectedrecordtype, selectedproxystatus, selectedttl, selectedip, selectedport) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$server->uuid, $selectedname, $selectedzone, "SRV", "DNS", "14400", $selectedip . " -> " . $server->node->fqdn, $selectedport]);
        
            // Return the response from the cPanel API
            return response()->json([
                'result' => $responseData,
            ], 200);
        }
        
        if ($selectedip == gethostbyname($server->node->fqdn)) {
            // Get the serial from the SOA record
            //$soaRecord = dns_get_record($selectedzone, DNS_SOA);
            //$serial = $soaRecord ? $soaRecord[0]['serial'] : null;
            $serial = "1337"; // This can be updated with the correct logic to get the actual serial but fuck slow ass DNS servers propagation issues
        
            if ($serial !== null) {
                return updateSRVRecord($selectedzone, $selectedname, $selectedport, $server, $pdo, $selectedip, $serial);
            }
        }        

        // END of For shared IPs //

        // Return a JSON response
        return response()->json([
            'selectedip' => $selectedip,
            'selectedport' => $selectedport,
            'server' => $server,
        ]);
    }

    
    public function deleteSubdomain(Server $server, Request $request)
    {

        $request->validate([
            'selectedname' => 'required|string',
            'selectedzone' => 'required|string',
        ]);
        $selectedname = $request->input('selectedname');
        $selectedzone = $request->input('selectedzone');

        //============================================================================= //
        // START of Connect to the coems remote SQL and check if found in the database
        //============================================================================= //
        // Check if the $server->uuid, selectedname, and selectedzone is found in the database
        $host = env('SUBDOMAIN_DATABASE_HOST');
        $port = env('SUBDOMAIN_DATABASE_PORT');
        $user = env('SUBDOMAIN_DATABASE_USER');
        $password = env('SUBDOMAIN_DATABASE_PASSWORD');
        $dbname = env('SUBDOMAIN_DATABASE_NAME');
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname";

        try {
            $pdo = new \PDO($dsn, $user, $password);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        } catch (\PDOException $e) {
            return response()->json(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
        }
        
        // Check if the record exists in the database
        $stmt = $pdo->prepare("SELECT * FROM subdomains WHERE server_uuid = ? AND selectedname = ? AND selectedzone = ?");
        $stmt->execute([$server->uuid, $selectedname, $selectedzone]);
        if (!$stmt->fetch()) {
            return response()->json(['error' => 'Record not found in database.'], 404);
        }
        //============================================================================= //
        // END of Connect to the coems remote SQL and check if found in the database
        //============================================================================= //
        
        // Get the serial from the SOA record
        //$soaRecord = dns_get_record($selectedzone, DNS_SOA);
        //$serial = $soaRecord ? $soaRecord[0]['serial'] : null;
        $serial = "1337";

        
        // Start of Contact cPanel API and remove the SRV record //
        if ($serial !== null) {
            // Call cPanel API to get the DNS zone
            $url = env('CPANEL_URL') . ':' . env('CPANEL_PORT') . '/execute/DNS/parse_zone?zone=' . $selectedzone;
            $client = new Client();
            $response = $client->get($url, [
                'headers' => [
                    'Authorization' => env('CPANEL_AUTHORIZATION_VALUE'),
                ],
            ]);
            $zoneData = json_decode((string)$response->getBody(), true);
        
            //============================================================================= //
            // START of Concurrency semaphore region
            //============================================================================= //
            $key = ftok(__FILE__, 't'); // Create unique key based on this file
            $semaphore = sem_get($key, 1); // Create or get a semaphore with 1 permit
            if (!$semaphore || !sem_acquire($semaphore)) {
                return response()->json(['error' => 'Another deletion process is in progress, please try again later'], 429);
            }
            
            // Find the index to remove
            $encodedSelectedName = base64_encode('_minecraft._tcp.' . $selectedname);
            $indextoremove = null;
            foreach ($zoneData['data'] as $record) {
                if (isset($record['dname_b64']) && $record['record_type'] === 'SRV' && $record['dname_b64'] === $encodedSelectedName) {
                    $indextoremove = $record['line_index'];
                    break;
                } elseif (isset($record['dname_b64']) && $record['record_type'] === 'A' && $record['dname_b64'] === base64_encode($selectedname)) {
                    $indextoremove = $record['line_index'];
                    break;
                }
            }
        
            if ($indextoremove !== null) {
                $retryCount = 0;
                $success = false;
                
                // Retry loop for sending the request
                while (!$success && $retryCount < 3) {
                    // Build the data parameter
                    $data = [
                        'serial' => $serial,
                        'zone' => $selectedzone,
                        'remove' => $indextoremove,
                    ];
        
                    // Send the POST request to remove the SRV record
                    $url = env('CPANEL_URL') . ':' . env('CPANEL_PORT') . '/execute/DNS/mass_edit_zone';
                    $response = $client->post($url, [
                        'headers' => [
                            'Authorization' => env('CPANEL_AUTHORIZATION_VALUE'),
                            'Content-Type' => 'application/json',
                        ],
                        'json' => $data,
                    ]);
                    
                    $responseData = json_decode((string)$response->getBody(), true);
        
                    // Check for errors and specific error message
                    if (isset($responseData['errors'])) {
                        foreach ($responseData['errors'] as $error) {
                            if (preg_match('/\((\d+)\) does not match the DNS zone’s serial number \((\d+)\)/', $error, $matches)) {
                                // Found serial in error message, retry with it
                                $serial = $matches[2];
                                $retryCount++;
                                continue 2;
                            }
                        }
                    }
        
                    $success = true; // Break loop if no matching error found
                }
        
                // If success after retrying
                if ($success) {
                    // Release semaphore after deletion
                    sem_release($semaphore);
        
                    // Remove the record from the SQL database
                    $stmt = $pdo->prepare("DELETE FROM subdomains WHERE server_uuid = ? AND selectedname = ? AND selectedzone = ?");
                    $stmt->execute([$server->uuid, $selectedname, $selectedzone]);
        
                    return response()->json(['message' => 'Subdomain deleted successfully'], 200);
                } else {
                    // Handle failure after retries
                    sem_release($semaphore);
                    return response()->json(['error' => 'Failed to delete SRV record after retries.'], 500);
                }
            } else {
                sem_release($semaphore);
                // Remove the record from the SQL database
                $stmt = $pdo->prepare("DELETE FROM subdomains WHERE server_uuid = ? AND selectedname = ? AND selectedzone = ?");
                $stmt->execute([$server->uuid, $selectedname, $selectedzone]);
                return response()->json(['error' => 'Subdomain record not found in DNS zone, so removing from database.'], 404);
            }
            //============================================================================= //
            // END of Concurrency semaphore region
            //============================================================================= //
        } else {
            return response()->json(['error' => 'Failed to retrieve SOA serial.'], 500);
        }
        // End of Contact cPanel API and remove the SRV record //

        // Return a JSON response
        return response()->json([
            'selectedname' => $selectedname,
            'selectedzone' => $selectedzone,
            'server' => $server,
        ]);
    }

}