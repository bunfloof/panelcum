<?php

namespace Pterodactyl\BunStuff;

use PDO;

class WHMCSGetInfo
{
    protected $whmcsHost;
    protected $whmcsPort;
    protected $whmcsDBUser;
    protected $whmcsDBPassword;
    protected $whmcsDBName;

    public function __construct()
    {
        $this->whmcsHost = env('WHMCS_HOST');
        $this->whmcsPort = env('WHMCS_PORT', 3306);
        $this->whmcsDBUser = env('WHMCS_DATABASE_USER');
        $this->whmcsDBPassword = env('WHMCS_DATABASE_PASSWORD');
        $this->whmcsDBName = env('WHMCS_DATABASE_NAME');
    }

    public function getInfo(int $serviceId): array
    {

        $dsn = "mysql:host={$this->whmcsHost};dbname={$this->whmcsDBName};charset=utf8";
        $opt = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, $this->whmcsDBUser, $this->whmcsDBPassword, $opt);

        $stmt = $pdo->prepare(
            "SELECT p.id, p.name, p.configoption1, p.configoption2, p.configoption3, p.configoption4, p.configoption5, p.configoption6, p.configoption7, p.configoption8, p.configoption9, p.configoption10, p.configoption11, p.configoption12, p.configoption13, p.configoption14, p.configoption15, p.configoption16, p.configoption17, p.configoption18, p.configoption19, p.configoption20, p.configoption21, p.configoption22, p.configoption23, p.configoption24
            FROM `{$this->whmcsDBName}`.`tblhosting` h
            JOIN `{$this->whmcsDBName}`.`tblproducts` p
            ON h.packageid = p.id
            WHERE h.id = :id"
        );
        $stmt->execute([':id' => $serviceId]);

        return $stmt->fetch();
    }
}
