<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\BunStuff\WHMCSGetInfo;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\ServerDeletionService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ServerSplitterController extends ClientApiController
{
    /**
     * SplitterController constructor.
     *
     * @param ServerDeletionService $serverDeletionService
     */
    public function __construct(
        private ServerDeletionService $serverDeletionService,
    ) {
    }

    /**
     * Returns the amount of RAM for a specific server.
     *
     * @throws NotFoundHttpException
     */
    public function getInfo(Server $server): array
    {   
        $whmcs = new WHMCSGetInfo();
        $info = $whmcs->getInfo(intval($server->external_id)); // because WHMCS only accepts int
        return (['info' => $info]);
    }

}
