<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\BunStuff\Spiget4PHP\SpigetAPI;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PluginsController extends ClientApiController
{
    
    /**
     * Returns plugin search results
     *
     * @throws NotFoundHttpException
     */
    public function getSearchPlugins(Request $request)
    {
        try {
            // Instantiate the SpigetAPI.
            $spiget = SpigetAPI::getInstance();
        
            // Get parameters from the request.
            $size = $request->input('size', '10');
            $page = $request->input('page', '1');
            $sort = $request->input('sort', '-downloads');
            $fields = $request->input('fields', 'file,icon.url,name,tag,releaseDate,updateDate,downloads,rating');
            $resource = $request->input('resource', '');
            
            // Convert the fields string to an array.
            if (is_string($fields)) {
                $fields = explode(',', $fields);
            }

            $args = [
                "size" => $size,
                "page" => $page,
                "sort" => $sort,
                "fields" => $fields,
            ];
        
            if (empty($resource)) {
                $resource = 'essentials';  // replace with an appropriate default value.
            }

            if (!empty($resource)) {
                $args["resource"] = $resource;
            }
            
            // Log the request parameters.
            // Log::info('getSearchPlugins request parameters: ', [
            //     'resource' => $resource,
            //     'size' => $size,
            //     'page' => $page,
            //     'sort' => $sort,
            //     'fields' => $fields,
            // ]);
        
            // Fetch the results.
            $results = $spiget->getSearchResource($resource, $size, $page, $sort, $fields);
        
            return response()->json(['results' => $results]);
    
        } catch (\Exception $e) {
            // Log the exception.
            Log::error('getSearchPlugins failed with exception: ', [
                'exception' => $e->getMessage(),
            ]);
    
            return response()->json(['error' => 'An error occurred while processing your request.'], 500);
        }
    }
    
}
