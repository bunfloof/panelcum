<?php

namespace Pterodactyl\BunStuff\CurseForge;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\BadResponseException;

class CurseForgeAPI
{
    protected $apiKey;
    protected $client;

    public function __construct()
    {
        $this->apiKey = env('CURSEFORGE_API_KEY');
        $this->client = new Client(['base_uri' => 'https://api.curseforge.com/v1/']);
    }

    public function getModsSearch(int $gameId, $classId = null, $sortOrder = 'desc', $sortField = 6, $index = 0, $pageSize = 20, $searchFilter = '')
    {
        $headers = [
            'Accept' => 'application/json',
            'x-api-key' => $this->apiKey,
        ];

        $query = [
            'gameId' => $gameId,
            'sortOrder' => $sortOrder,
            'sortField' => $sortField,
            'index' => $index,
            'pageSize' => $pageSize,
            'searchFilter' => $searchFilter,
        ];

        if ($classId) {
            $query['classId'] = $classId;
        }

        try {
            $response = $this->client->request('GET', 'mods/search', [
                'headers' => $headers,
                'query' => $query,
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (BadResponseException $e) {
            // handle exception or api errors.
            return ['error' => $e->getMessage()];
        }
    }

    public function getModFiles(int $modId, $index = 0, $pageSize = 20)
    {
        $headers = [
            'Accept' => 'application/json',
            'x-api-key' => $this->apiKey,
        ];
    
        $query = [
            'index' => $index,
            'pageSize' => $pageSize,
        ];
    
        try {
            $response = $this->client->request('GET', 'mods/'.$modId.'/files', [
                'headers' => $headers,
                'query' => $query,
            ]);
    
            return json_decode($response->getBody()->getContents(), true);
        } catch (BadResponseException $e) {
            // handle exception or api errors.
            return ['error' => $e->getMessage()];
        }
    }    
}
