<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Request;
use Pterodactyl\BunStuff\MinecraftPing\MinecraftPing;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\BunStuff\MinecraftPing\MinecraftPingException;

class PlayersController extends ClientApiController
{
    public function getPlayers(Request $request)
    {
        $serverIP = $request->input('server_ip');
        $serverPort = $request->input('server_port');

        try
        {
            $Query = new MinecraftPing( $serverIP, $serverPort );
            $result = $Query->Query();
            $Query->Close();

            if (isset($result)) {
                return response()->json($result);
            } else {
                return response()->json([]);
            }
        }
        catch(MinecraftPingException $e)
        {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
