<?php

namespace Pterodactyl\Transformers\Api\Client;

use Illuminate\Support\Arr;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Server;
use League\Fractal\Resource\Item;
use Pterodactyl\Models\EggVariable;
use League\Fractal\Resource\Collection;
use League\Fractal\Resource\NullResource;
use Pterodactyl\Services\Acl\Api\AdminAcl;

class ClientEggTransformer extends BaseClientTransformer
{
    /**
     * Relationships that can be loaded onto this transformation.
     */
    protected array $availableIncludes = [
        'nest',
        'servers',
        'config',
        'script',
        'variables',
    ];

    /**
     * Return the resource name for the JSONAPI output.
     */
    public function getResourceName(): string
    {
        return Egg::RESOURCE_NAME;
    }

    /**
     * Transform an Egg model into a representation that can be consumed by
     * the application api.
     *
     * @throws \JsonException
     */
    public function transform(Egg $model): array
    {
        $files = json_decode($model->config_files, true, 512, JSON_THROW_ON_ERROR);
        if (empty($files)) {
            $files = new \stdClass();
        }

        return [
            'id' => $model->id,
            'egg_name' => $model->name,
            'egg_variables' => $model->variables,
            'nest' => $model->nest_id,
            'nest_name' => $model->nest_name,
            'startup' => $model->startup,
            'image' => Arr::first($model->docker_images),
        ];
    }

    /**
     * Include the Nest relationship for the given Egg in the transformation.
     *
     * @throws \Pterodactyl\Exceptions\Transformer\InvalidTransformerLevelException
     */
    public function includeNest(Egg $model): Item|NullResource
    {
        // if (!$this->authorize(AdminAcl::RESOURCE_NESTS)) {
        //     return $this->null();
        // }

        $model->loadMissing('nest');

        return $this->item($model->getRelation('nest'), $this->makeTransformer(NestTransformer::class), Nest::RESOURCE_NAME);
    }

    /**
     * Include the Servers relationship for the given Egg in the transformation.
     *
     * @throws \Pterodactyl\Exceptions\Transformer\InvalidTransformerLevelException
     */
    public function includeServers(Egg $model): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_SERVERS)) {
            return $this->null();
        }

        $model->loadMissing('servers');

        return $this->collection($model->getRelation('servers'), $this->makeTransformer(ServerTransformer::class), Server::RESOURCE_NAME);
    }

    /**
     * Include more detailed information about the configuration if this Egg is
     * extending another.
     */
    public function includeConfig(Egg $model): Item|NullResource
    {
        if (is_null($model->config_from)) {
            return $this->null();
        }

        $model->loadMissing('configFrom');

        return $this->item($model, function (Egg $model) {
            return [
                'files' => json_decode($model->inherit_config_files),
                'startup' => json_decode($model->inherit_config_startup),
                'stop' => $model->inherit_config_stop,
                'logs' => json_decode($model->inherit_config_logs),
            ];
        });
    }

    /**
     * Include more detailed information about the script configuration if the
     * Egg is extending another.
     */
    public function includeScript(Egg $model): Item|NullResource
    {
        if (is_null($model->copy_script_from)) {
            return $this->null();
        }

        $model->loadMissing('scriptFrom');

        return $this->item($model, function (Egg $model) {
            return [
                'privileged' => $model->script_is_privileged,
                'install' => $model->copy_script_install,
                'entry' => $model->copy_script_entry,
                'container' => $model->copy_script_container,
            ];
        });
    }

    /**
     * Include the variables that are defined for this Egg.
     *
     * @throws \Pterodactyl\Exceptions\Transformer\InvalidTransformerLevelException
     */
    public function includeVariables(Egg $model): Collection|NullResource
    {
        if (!$this->authorize(AdminAcl::RESOURCE_EGGS)) {
            return $this->null();
        }

        $model->loadMissing('variables');

        return $this->collection(
            $model->getRelation('variables'),
            $this->makeTransformer(EggVariableTransformer::class),
            EggVariable::RESOURCE_NAME
        );
    }
}
