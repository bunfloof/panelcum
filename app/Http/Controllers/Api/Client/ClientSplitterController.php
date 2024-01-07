<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Support\Facades\Cache;
use Pterodactyl\BunStuff\WHMCSGetInfo;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Client;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Objects\DeploymentObject;
use Pterodactyl\Services\Servers\ServerDeletionService;
use Pterodactyl\Services\Servers\ServerCreationService;
use Pterodactyl\Services\Servers\DetailsModificationService;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Services\Servers\BuildModificationService;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Pterodactyl\Models\Filters\MultiFieldServerFilter;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Contracts\Repository\EggRepositoryInterface;
use Pterodactyl\Transformers\Api\Client\ClientNestTransformer;
use Pterodactyl\Transformers\Api\Client\ClientEggTransformer;
use Pterodactyl\Http\Requests\Api\Client\GetServersRequest;

class ClientSplitterController extends ClientApiController
{
    public function __construct(
        private ServerDeletionService $serverDeletionService,
        private ServerCreationService $serverCreationService,
        private StartupModificationService $startupModificationService,
        private BuildModificationService $buildModificationService,
        private DetailsModificationService $detailsModificationService,
        private NestRepositoryInterface $nestRepository,
        private EggRepositoryInterface $eggRepository,
    ) 
    {
        parent::__construct();
    }


    /**
     * Return all the servers available to the client making the API
     * request, including servers the user has access to as a subuser.
     */
    public function delete(GetServersRequest $request, String $uuid): array
    {
        $user = $request->user();
        $transformer = $this->getTransformer(ServerTransformer::class);

        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder = QueryBuilder::for(
            Server::query()->with($this->getIncludesForTransformer($transformer, ['node']))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ]);

        // Ensure that the user has access to the server.
        $builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());

        // Filter servers where external_id contains 'sub'
        $builder = $builder->where('external_id', 'like', '%sub%');

        // Find the server with the given UUID.
        $server = $builder->where('uuid', $uuid)->firstOrFail();
        //return $this->fractal->transformWith($transformer)->item($server)->toArray();

        return [
            'Deleted' => 'Received',
            'data' => $this->serverDeletionService->handle($server),
        ];      


    }
    
    public function nests(): array
    {
        $nest = $this->nestRepository->all();
    
        return $this->fractal->collection($nest)
        ->transformWith($this->getTransformer(ClientNestTransformer::class))
        ->toArray();
    }

    public function eggs(): array
    {
        $eggs = $this->eggRepository->all();
    
        return $this->fractal->collection($eggs)
        ->transformWith($this->getTransformer(ClientEggTransformer::class))
        ->toArray();
    }

    public function bird(): array
    {
        $nests = $this->nests()['data'];
        $eggs = $this->eggs()['data'];
    
        // Create a dictionary of nests by id for efficient lookup.
        $nestDict = [];
        foreach ($nests as $nest) {
            $nestDict[$nest['attributes']['id']] = $nest['attributes']['name'];
        }
    
        // Map over the eggs and add the nest_name to each egg.
        $birdData = array_map(function ($egg) use ($nestDict) {
            return [
                'object' => 'bird',
                'attributes' => [
                    'nest_name' => $nestDict[$egg['attributes']['nest']],
                    'nest_id' => $egg['attributes']['nest'],
                    'egg_name' => $egg['attributes']['egg_name'],
                    'egg_id' => $egg['attributes']['id'],
                    'egg_variables' => $egg['attributes']['egg_variables'],
                ],
            ];
        }, $eggs);
    
        return [
            'object' => 'list',
            'data' => $birdData,
        ];
    }

    public function getEggVars(int $egg_id): array
    {
        $eggs = $this->eggs()['data'];
    
        foreach ($eggs as $egg) {
            if ($egg['attributes']['id'] == $egg_id) {
                $eggEnvVars = [];
    
                // Iterate through each variable in egg_variables
                foreach ($egg['attributes']['egg_variables'] as $variable) {
                    $eggEnvVars[$variable['env_variable']] = $variable['default_value'];
                }

                // return the eggEnvVars array
                return [
                    'eggStartup' => $egg['attributes']['startup'],
                    'eggEnvVars' => $eggEnvVars,
                    'eggDockerImage' => $egg['attributes']['image'],
                ];    
        
            }
        }
    
        // If egg_id not found, return an empty array
        return []; 
    }
    
    public function getEggOther(int $egg_id): array
    {
        $eggs = $this->eggs()['data'];
    
        foreach ($eggs as $egg) {
            if ($egg['attributes']['id'] == $egg_id) {
                $eggVars = [];
    
                // Iterate through each variable in egg_variables
                foreach ($egg['attributes']['egg_variables'] as $variable) {
                    $eggVars[$variable['env_variable']] = $variable['default_value'];
                }

                // return the eggVars array
                return $eggVars;
            }
        }
    
        // If egg_id not found, return an empty array
        return []; 
    }
    
    public function validateRequest(GetServersRequest $request): array
    {
        $values = $request->input();

        // Check if all required parameters are present
        if (!isset($values['disk']) || trim($values['disk']) === '') {
            return ['status' => 'error', 'message' => "The 'disk' field is required."];
        }
    
        if (!isset($values['egg']) || trim($values['egg']) === '') {
            return ['status' => 'error', 'message' => "The 'egg' field is required."];
        }
    
        if (!isset($values['name']) || trim($values['name']) === '') {
            return ['status' => 'error', 'message' => "The 'name' field is required."];
        }
    
        if (!isset($values['nest']) || trim($values['nest']) === '') {
            return ['status' => 'error', 'message' => "The 'nest' field is required."];
        }
    
        if (!isset($values['ram']) || trim($values['ram']) === '') {
            return ['status' => 'error', 'message' => "The 'ram' field is required."];
        }
    
        // Check if disk and ram values are numeric
        if(!is_numeric($values['disk'])){
            return ['status' => 'error', 'message' => 'Disk value must be a number.'];
        }
    
        if(!is_numeric($values['ram'])){
            return ['status' => 'error', 'message' => 'Ram value must be a number.'];
        }

        if(!is_numeric($values['egg'])){
            return ['status' => 'error', 'message' => 'Egg value must be a number.'];
        }

        if($values['ram'] < 1) {
            return ['status' => 'error', 'message' => 'Ram value must be a number greater than 1.'];
        }

        if($values['disk'] < 1) {
            return ['status' => 'error', 'message' => 'Disk value must be a number greater than 1.'];
        }
    
        return ['status' => 'success', 'values' => $values];
    }

    public function primaryExternalId($externalId) {
        preg_match('/^(\d+)/', $externalId, $matches);
        return isset($matches[0]) ? $matches[0] : null;
    }

    function getAllServersById(GetServersRequest $request, $primaryExternalId): Array 
    {
        $user = $request->user();
    
        $transformer = $this->getTransformer(ServerTransformer::class);
        
        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder = QueryBuilder::for(
            Server::query()->with($this->getIncludesForTransformer($transformer, ['node']))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ]); 
    
        // Ensure that the user has access to the server.
        //$builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        
        // Filter servers where external_id contains '173'
        $servers = $builder->where('external_id', 'like', $primaryExternalId . '%')->get();
    
        // Use the transformer to transform the data
        $data = $this->fractal->transformWith($transformer)->collection($servers)->toArray();
    
        return $data;
    }
    
    function getAllSubServersById(GetServersRequest $request, $primaryExternalId): Array 
    {
    
        $transformer = $this->getTransformer(ServerTransformer::class);
        
        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder = QueryBuilder::for(
            Server::query()->with($this->getIncludesForTransformer($transformer, ['node']))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ]); 
    
        // Ensure that the user has access to the server.
        //$builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        
        // Filter servers where external_id contains '173'
        $servers = $builder->where('external_id', 'like', $primaryExternalId . 'sub%')->get();

        // Use the transformer to transform the data
        $data = $this->fractal->transformWith($transformer)->collection($servers)->toArray();
    
        return $data;
    }

    // This is a public function, so the request checks are necessary to prevent unauthorized read
    public function getCountAllSubServersByIdWithPrimaryIdCheck(GetServersRequest $request, $externalid): array 
    {
        $primaryExternalId = $this->primaryExternalId($externalid);

        // initial check
        $user = $request->user();
        $transformer1 = $this->getTransformer(ServerTransformer::class);

        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder1 = QueryBuilder::for(
            Server::query()->with($this->getIncludesForTransformer($transformer1, ['node']))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ]);
        // Ensure that the user has access to the server.
        $builder1 = $builder1->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());        
        // Filter servers where external_id starts with primaryExternalId.
        $count2 = $builder1->where('external_id', 'like', $primaryExternalId . '%')->count();

        if ($count2 < 1) { // if user doesn't have access to any of the owner's servers, return 0.
            return ['count' => 'No access'];
        }

        // end of initial check
    
        $transformer2 = $this->getTransformer(ServerTransformer::class);
        
        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder2 = QueryBuilder::for(
            Server::query()->with($this->getIncludesForTransformer($transformer2, ['node']))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ]); 
        
        // Filter servers where external_id contains '173'
        $count = $builder2->where('external_id', 'like', $primaryExternalId . 'sub%')->count();
    
        return ['count' => $count];
    }

    public function getTotalAllocatedRam(Array $servers) 
    {
        if (empty($servers)) {
            return "No servers data.";
        }
    
        // Debugging line to check the server data
        //dd($servers[0]);
    
        $totalMemory = 0;
        foreach ($servers as $server) {
            if (isset($server['attributes']['limits']['memory'])) {
                $totalMemory += $server['attributes']['limits']['memory'];
            }
        }
        return $totalMemory;
    }

    public function getTotalAllocatedDisk(Array $servers) 
    {
        if (empty($servers)) {
            return "No servers data.";
        }
    
        // Debugging line to check the server data
        //dd($servers[0]);
    
        $totalDisk = 0;
        foreach ($servers as $server) {
            if (isset($server['attributes']['limits']['disk'])) {
                $totalDisk += $server['attributes']['limits']['disk'];
            }
        }
        return $totalDisk;
    }

    public function getRamAndDiskInfo(GetServersRequest $request, String $externalid): array
    {   

        $primaryExternalId = $this->primaryExternalId($externalid);

        $allServers = $this->getAllServersById($request, $primaryExternalId);

        $allAllocatedRam = $this->getTotalAllocatedRam($allServers['data']);

        $allAllocatedDisk = $this->getTotalAllocatedDisk($allServers['data']);

        $originalRam = $this->whmcsGetInfo($primaryExternalId)['configoption3'];    

        $originalDisk = $this->whmcsGetInfo($primaryExternalId)['configoption2'];    
        
        $availableRam = $originalRam - $allAllocatedRam;

        $availableDisk = $originalDisk - $allAllocatedDisk;

        return ['allAllocatedRam' => $allAllocatedRam,
                'allAllocatedDisk' => $allAllocatedDisk,
                'availableRam' => $availableRam,
                'availableDisk' => $availableDisk,
                'originalRam' => $originalRam,
                'originalDisk' => $originalDisk,
        ];
    }
    
    public function whmcsGetInfo($primaryExternalId): array
    {   
        $whmcs = new WHMCSGetInfo();
        $info = $whmcs->getInfo($primaryExternalId);
        return $info;
    }

    public function createServer(GetServersRequest $request): array
    {

        // $values = $request->input();

        // $primaryExternalId = $this->primaryExternalId($values['external_id']);

        // $allServers = $this->getAllServersById($request, $primaryExternalId);

        // $allAllocatedRam = $this->getTotalAllocatedRam($allServers['data']);

        // $originalRam = $this->whmcsGetInfo($primaryExternalId)['configoption3'];


        //return $primaryServer;

        $validation = $this->validateRequest($request);
        
        if($validation['status'] === 'error') {
            return $validation;
        }

        $values = $validation['values'];

        $primaryExternalId = $this->primaryExternalId($values['external_id']);

        $allServers = $this->getAllServersById($request, $primaryExternalId);

        $allSubServers = $this->getAllSubServersById($request, $primaryExternalId);

        $allAllocatedRam = $this->getTotalAllocatedRam($allServers['data']);

        $allAllocatedDisk = $this->getTotalAllocatedDisk($allServers['data']);

        $originalRam = $this->whmcsGetInfo($primaryExternalId)['configoption3'];    

        $originalDisk = $this->whmcsGetInfo($primaryExternalId)['configoption2'];    
        
        $availableRam = $originalRam - $allAllocatedRam;

        $availableDisk = $originalDisk - $allAllocatedDisk;
        
        $maxSubServers = $originalRam / 1024 / 2;
        

        $lock = Cache::lock('create-server-' . $primaryExternalId, 10);
        if ($lock->get()) {

            if (count($allSubServers['data']) >= $maxSubServers) {
                return ['status' => 'error', 'message' => "Not enough splits available for this operation."];
            }

            if ($values['ram'] > $availableRam) {
                return ['status' => 'error', 'message' => "Not enough available memory (RAM) for this operation. Requested: {$values['ram']}, Available: {$availableRam}"];
            }

            if ($values['disk'] > $availableDisk) {
                return ['status' => 'error', 'message' => "Not enough available disk for this operation. Requested: {$values['disk']}, Available: {$availableDisk}"];
            }


            
            // return [
            //     'object' => 'list',
            //     'data' => $values,
            // ];    


            $eggs = $this->eggs()['data'];
            // return [
            //     'object' => 'list',
            //     'data' => $eggs,
            // ];    


            $user = $request->user();
            if (!array_key_exists('external_id', $values)) {
                return [
                    'error' => 'external_id is missing'
                ];
            }
            
            $eggDetails = $this->getEggVars($values['egg']);

            // return [
            //     'object' => 'list',
            //     'data' => $eggDetails,
            // ];    

            
            //$external_id = $values['external_id'];

            $transformer = $this->getTransformer(ServerTransformer::class);
            
            // Start the query builder and ensure we eager load any requested relationships from the request.
            $builder = QueryBuilder::for(
                Server::query()->with($this->getIncludesForTransformer($transformer, ['node']))
            )->allowedFilters([
                'uuid',
                'name',
                'description',
                'external_id',
                
                AllowedFilter::custom('*', new MultiFieldServerFilter()),
            ]); 

            // Ensure that the user has access to the server.
            //$builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());

            // Clone coems to prevent mutation
            $builder2 = clone $builder;

            
            // Filter servers where external_id is an exact match of primaryExternalId
            $primaryserver = $builder->where('external_id', $primaryExternalId)->get();

            // Filter servers where external_id contains strictly external_id + sub
            $subservers = $builder2->where('external_id', 'like', $primaryExternalId . 'sub%')->get();

            //return $this->fractal->transformWith($transformer)->collection($primaryserver)->toArray();
            
            $maxNumber = 0;
            // Get maxNumber of sub
            if ($subservers) {
                $maxNumber = $subservers->reduce(function ($max, $server) {
                    preg_match('/(\d+)sub(\d+)/', $server->external_id, $matches);
                    $number = isset($matches[2]) ? intval($matches[2]) : 0;
                    return max($max, $number);
                }, 0);
            }

            // Get location_id
            //$primaryserverlocation_id = $primaryserver->location_id;
            $primaryServerItem = $primaryserver->firstOrFail();
            //return ['primtest' => $primaryServerItem->toArray()];
            

            $serverData = [
                'name' => $values['name'],
                'user' => (int) $primaryServerItem->owner_id,
                'egg' => (int) $values['egg'],
                'docker_image' => $eggDetails['eggDockerImage'],
                'startup' => $eggDetails['eggStartup'],
                'oom_disabled' => false,
                'limits' => [
                    'memory' => (int) $values['ram'],
                    'swap' => 0,
                    'io' => 500,
                    'cpu' => 800,
                    'disk' => (int) $values['disk'],
                ],
                'feature_limits' => [
                    'databases' => 10,
                    'allocations' => 10,
                    'backups' => 3,
                ],
                'deploy' => [
                    'locations' => [(int) $primaryServerItem->node->location_id],
                    'dedicated_ip' => false,
                    'port_range' => ['25565-25700'],
                ],
                'environment' => $eggDetails['eggEnvVars'],
                'start_on_completion' => true,
                'external_id' => "{$primaryExternalId}sub" . ($maxNumber + 1),
            ];

            $httpProtocol = getenv('SPLITTER_HTTP_OR_HTTPS');
            $serverAddress = getenv('SPLITTER_SERVER_ADDRESS');
            $apiToken = getenv('SPLITTER_API_KEY');

            $jsonData = json_encode($serverData);

            $url = $httpProtocol . '://' . $serverAddress . '/api/application/servers';

            $curl = curl_init();
            curl_setopt($curl, CURLOPT_URL, $url);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');
            curl_setopt($curl, CURLOPT_POSTFIELDS, $jsonData);
            curl_setopt($curl, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);
            
            $headers = [
                "Authorization: Bearer " . $apiToken,
                "Accept: Application/vnd.pterodactyl.v1+json",
                "Content-Type: application/json",
                "Content-Length: " . strlen($jsonData)
            ];
            
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
            
            $response = curl_exec($curl);
            $httpStatusCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
            
            if ($httpStatusCode !== 201) {
                return ['status' => 'error', 'message' => 'Failed to create (Splitter) the server', 'response' => $response];
            }
            
            return [
                'object' => 'Created',
                'data' => json_decode($response, true)
            ];

            $lock->release();
        } else {
            return ['status' => 'error', 'message' => "Another server creation action is currently being processed, please try again later."];
        }

    }

    public function editServer(GetServersRequest $request, String $uuid): array
    {   
        $validation = $this->validateRequest($request);
        
        if($validation['status'] === 'error') {
            return $validation;
        }

        $values = $validation['values'];

        $user = $request->user();
        $transformer = $this->getTransformer(ServerTransformer::class);

        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder = QueryBuilder::for(
            Server::query()->with($this->getIncludesForTransformer($transformer, ['node']))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ]);

        // Ensure that the user has access to the server.
        $builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());


        // Find the server with the given UUID.
        $server = $builder->where('uuid', $uuid)->firstOrFail();

        $primaryExternalId = $this->primaryExternalId($values['external_id']);
    
        $allServers = $this->getAllServersById($request, $primaryExternalId);
    
        $allAllocatedRam = $this->getTotalAllocatedRam($allServers['data']);
        
        $allAllocatedDisk = $this->getTotalAllocatedDisk($allServers['data']);

        $originalRam = $this->whmcsGetInfo($primaryExternalId)['configoption3'];    

        $originalDisk = $this->whmcsGetInfo($primaryExternalId)['configoption2'];
        
        $availableRam = $originalRam - $allAllocatedRam + $server->memory;

        $availableDisk = $originalDisk - $allAllocatedDisk + $server->disk;

        if ($values['ram'] > $availableRam) {
            return ['status' => 'error', 'message' => "Not enough available memory (RAM) for this operation. Requested: {$values['ram']}, Available: {$availableRam}"];
        }

        if ($values['disk'] > $availableDisk) {
            return ['status' => 'error', 'message' => "Not enough available disk for this operation. Requested: {$values['disk']}, Available: {$availableDisk}"];
        }

        // return [
        //     'object' => $server->toArray(),
        // ];     

        $eggDetails = $this->getEggVars($values['egg']);

        // The details array for the DetailsModificationService
        $details = [
            'external_id' => $server->external_id,
            'owner_id' => $server->owner_id,
            'name' => $values['name'],
            'description' => $server->description,
        ];

        // The startup array for the StartupModificationService
        // $startup = [
        //     'egg_id' => 2,
        //     'startup' => "java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal…alse -Dterminal.ansi=true -jar {{SERVER_JARFILE}}",
        //     'skip_scripts' => false,
        //     'docker_image' => "ghcr.io/pterodactyl/yolks:java_17",
        // ];

        $startup = [
            'egg_id' => $values['egg'],
            'startup' => $eggDetails['eggStartup'],
            'skip_scripts' => $server->skip_scripts,
            'docker_image' => $eggDetails['eggDockerImage'],
        ];

        // The build array for the BuildModificationService
        $build = [
            'memory' => $values['ram'],
            'disk' => $values['disk'],
            'allocation_id' => $server->allocation_id,
            'oom_disabled' => $server->oom_disabled,
            'swap' => $server->swap,
            'io' => $server->io,
            'cpu' => $server->cpu,
            'threads' => $server->threads,
            'database_limit' => $server->database_limit,
            'allocation_limit' => $server->allocation_limit,
            'backup_limit' => $server->backup_limit,
            'add_allocations' => [],
            'remove_allocations' => [],           
        ];
        $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);
        $this->detailsModificationService->handle($server, $details);
        $this->startupModificationService->handle($server, $startup);
        $this->buildModificationService->handle($server, $build);

        return [
            'Received from editserver' => 'Ok',
        ];
   
    }


}
