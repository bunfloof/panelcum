<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Facades\Activity;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Pterodactyl\Models\Filters\MultiFieldServerFilter;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Contracts\Repository\EggRepositoryInterface;
use Pterodactyl\Transformers\Api\Client\ClientEggTransformer;
use Pterodactyl\Http\Requests\Api\Client\GetServersRequest;
use Pterodactyl\Services\Servers\ReinstallServerService;

class ClientModpackController extends ClientApiController
{
    
    public function __construct(
        private StartupModificationService $startupModificationService,
        private EggRepositoryInterface $eggRepository,
        private ReinstallServerService $reinstallServerService,
    ) 
    {
        parent::__construct();
    }
    
    public function eggs(): array
    {
        $eggs = $this->eggRepository->all();
    
        return $this->fractal->collection($eggs)
        ->transformWith($this->getTransformer(ClientEggTransformer::class))
        ->toArray();
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

    public function editServer(GetServersRequest $request, String $uuid, String $projectId, String $versionId): array
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
    
        // Find the server with the given UUID.
        $server = $builder->where('uuid', $uuid)->firstOrFail();
    
        $eggDetails = $this->getEggVars(15);
    
        $startup = [
            'egg_id' => env('CURSEFORGE_GENERIC_EGG_ID'),
            'startup' => $eggDetails['eggStartup'],
            'skip_scripts' => false,
            'docker_image' => $eggDetails['eggDockerImage'],
            'environment' => [
                'PROJECT_ID' => $projectId,
                'VERSION_ID' => $versionId,
                'API_KEY' => env('CURSEFORGE_API_KEY'),
            ],
        ];
    
        $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);
        $this->startupModificationService->handle($server, $startup);
        $this->reinstallServerService->handle($server);

        return [
            'Success' => 'Ok',
        ];
    }
    
}    