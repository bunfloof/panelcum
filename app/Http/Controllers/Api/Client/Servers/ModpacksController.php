<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\BunStuff\CurseForge\CurseForgeAPI;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ModpacksController extends ClientApiController
{
    public function getModsSearch(Request $request)
    {
        try {
            $curseForge = new CurseForgeAPI();
        
            $gameId = $request->input('gameId');
            $classId = $request->input('classId', null);
            $sortOrder = $request->input('sortOrder', 'desc');
            $sortField = $request->input('sortField', 6);
            $index = $request->input('index', 0);
            $pageSize = $request->input('pageSize', 20);
            $searchFilter = $request->input('searchFilter', '');
        
            $results = $curseForge->getModsSearch($gameId, $classId, $sortOrder, $sortField, $index, $pageSize, $searchFilter);

            return response()->json(['results' => $results]);
        } catch (\Exception $e) {
            Log::error('getModsSearch failed with exception: ', [
                'exception' => $e->getMessage(),
            ]);
        
            return response()->json(['error' => 'An error occurred while processing your request.'], 500);
        }
    }

    public function getModFiles(Request $request)
    {
        try {
            $curseForge = new CurseForgeAPI();
    
            $modId = $request->input('modId');
            $index = $request->input('index', 0);
            $pageSize = $request->input('pageSize', 20);
    
            $results = $curseForge->getModFiles($modId, $index, $pageSize);
    
            return response()->json(['results' => $results]);
        } catch (\Exception $e) {
            Log::error('getModFiles failed with exception: ', [
                'exception' => $e->getMessage(),
            ]);
    
            return response()->json(['error' => 'An error occurred while processing your request.'], 500);
        }
    }
    
}
