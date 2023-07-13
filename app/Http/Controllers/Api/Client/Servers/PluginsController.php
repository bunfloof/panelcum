<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\BunStuff\Spiget4PHP\SpigetAPI;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;

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
            $fields = $request->input('fields', 'file,icon.data,name,tag,releaseDate,updateDate,downloads,rating,id,version');
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

            $results = $spiget->getSearchResource($resource, $size, $page, $sort, $fields);
        
            return response()->json(['results' => $results]);
    
        } catch (\Exception $e) {
            Log::error('getSearchPlugins failed with exception: ', [
                'exception' => $e->getMessage(),
            ]);
    
            return response()->json(['error' => 'An error occurred while processing your request.'], 500);
        }
    }

    public function getDirectDownloadLink(Request $request)
    {
        try {
            $url = $request->input('url'); // Get the URL from the request

            // Create a new Guzzle client
            $client = new Client([
                'allow_redirects' => [
                    'track_redirects' => true
                ]
            ]);

            $response = $client->get($url); // Perform a GET request to the URL

            // Get the URI of the last redirect
            $directUrl = $response->getHeaderLine('X-Guzzle-Redirect-History');

            return response()->json(['url' => $directUrl]);
        } catch (\Exception $e) {
            Log::error('getDirectDownloadLink failed with exception: ', [
                'exception' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'An error occurred while processing your request.'], 500);
        }
    }
    
}
