<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;

class SubdomainsController extends ClientApiController
{
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
        if ($selectedip != $server->allocation->ip || $selectedport != $server->allocation->port) {
            return response()->json([
                'error' => 'The selected IP does not match the server\'s allocated IP or port.',
                // 'selectedip' => $selectedip,
                // '$server->allocation->ip' => $server->allocation->ip,
                // 'selectedport' => $selectedport,
                // '$server->allocation->port' => $server->allocation->port,
            ], 200); // Return a 400 Bad Request status code
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

        // Compare selectedip against the server's resolved FQDN
        if ($selectedip != gethostbyname($server->node->fqdn)) {
            return response()->json([
                'error' => 'The selected IP does not match the resolved IP of the server\'s FQDN.',
            ], 200); // Return a 400 Bad Request status code
        }

        // Contact cPanel API and create SRV record with the FQDN as the target
        if ($selectedip == gethostbyname($server->node->fqdn)) {
            // Get the serial from the SOA record
            $soaRecord = dns_get_record($selectedzone, DNS_SOA);
            $serial = $soaRecord ? $soaRecord[0]['serial'] : null;

            if ($serial !== null) {
                // Build the add parameter
                $data = [
                    'serial' => $serial, // Need to calculate this
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

                try {
                    // Send the POST request
                    $response = $client->post($url, [
                        'headers' => [
                            'Authorization' => env('CPANEL_AUTHORIZATION_VALUE'),
                            'Content-Type' => 'application/json',
                        ],
                        'json' => $data,
                    ]);

                    // Insert the record into the database
                    $query = "INSERT INTO subdomains (server_uuid, selectedname, selectedzone, selectedip, selectedport) VALUES (?, ?, ?, ?, ?)";
                    $stmt = $pdo->prepare($query);
                    $stmt->execute([$server->uuid, $selectedname, $selectedzone, $selectedip, $selectedport]);                
                
                    // Return the response from the cPanel API
                    return response()->json([
                        'result' => json_decode((string)$response->getBody(), true),
                    ], 200);
                
                } catch (\Exception $e) {
                    // If something goes wrong, return an error
                    return response()->json([
                        'error' => 'An error occurred: ' . $e->getMessage(),
                    ], 200);
                }
            }
        }

        // Return a JSON response
        return response()->json([
            'selectedip' => $selectedip,
            'selectedport' => $selectedport,
            'server' => $server,
        ]);
    }

    
    public function deleteSubdomain(Server $server, Request $request)
    {
        $lockFile = fopen(storage_path('deleteSubdomain.lock'), 'c+');
        if (!flock($lockFile, LOCK_EX | LOCK_NB)) {
            fclose($lockFile);
            return response()->json(['error' => 'Another deletion process is in progress, please try again later'], 429);
        }
        
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
        $soaRecord = dns_get_record($selectedzone, DNS_SOA);
        $serial = $soaRecord ? $soaRecord[0]['serial'] : null;

        // Contact cPanel API and remove the SRV record
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
    
            // Find the index to remove
            $encodedSelectedName = base64_encode('_minecraft._tcp.' . $selectedname);
            $indextoremove = null;
            foreach ($zoneData['data'] as $record) {
                if (isset($record['dname_b64']) && $record['record_type'] === 'SRV' && $record['dname_b64'] === $encodedSelectedName) {
                    $indextoremove = $record['line_index'];
                    break;
                }
            }
    
            if ($indextoremove !== null) {
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
    
                // Remove the record from the SQL database
                $stmt = $pdo->prepare("DELETE FROM subdomains WHERE server_uuid = ? AND selectedname = ? AND selectedzone = ?");
                $stmt->execute([$server->uuid, $selectedname, $selectedzone]);
    
                return response()->json(['message' => 'Subdomain deleted successfully'], 200);
            } else {
                return response()->json(['error' => 'Subdomain record not found in DNS zone.'], 404);
            }
        } else {
            return response()->json(['error' => 'Failed to retrieve SOA serial.'], 500);
        }
    
        // Return a JSON response
        return response()->json([
            'selectedname' => $selectedname,
            'selectedzone' => $selectedzone,
            'server' => $server,
        ]);
    }

}