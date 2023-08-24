[![Logo Image](https://cdn.pterodactyl.io/logos/new/pterodactyl_logo.png)](https://pterodactyl.io)

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/pterodactyl/panel/ci.yaml?label=Tests&style=for-the-badge&branch=1.0-develop)
![Discord](https://img.shields.io/discord/122900397965705216?label=Discord&logo=Discord&logoColor=white&style=for-the-badge)
![GitHub Releases](https://img.shields.io/github/downloads/pterodactyl/panel/latest/total?style=for-the-badge)
![GitHub contributors](https://img.shields.io/github/contributors/pterodactyl/panel?style=for-the-badge)

# Pterodactyl Panel with Bun's Coems
All modifications and improvements made to this project are available for free and released under an open-source license. As a contributor, my only request is that you acknowledge my contributions and provide attribution when using this code. The typical protocol in the open-source community encourages and appreciates such acknowledgment. This can be done by linking back to this GitHub repository ([bunfloof/panelcum](https://github.com/bunfloof/panelcum)) in your project documentation or crediting my GitHub username in your project's credits section.

Thank you for your understanding and cooperation.

# Modifications

## Subdomain Creator

- Uses cPanel's API to manage DNS.
- Uses a hackaround to get serial through cPanel's error message and then reattempting 3 times.
- cPanel doesn't have an endpoint to get the serial and using dns_get_record SOA to get serial has reliability issues due to DNS caches.

**This modification requires cPanel and a MySQL/MariaDB database to work.**

Append and fill the following to `.env`:
```
CPANEL_URL=
CPANEL_PORT=
CPANEL_AUTHORIZATION_VALUE=
SUBDOMAIN_DATABASE_HOST=
SUBDOMAIN_DATABASE_PORT=
SUBDOMAIN_DATABASE_USER=
SUBDOMAIN_DATABASE_PASSWORD=
SUBDOMAIN_DATABASE_NAME=
```

## 🤤🤤🤤 Modpack installer

Remember to supply the API key and curseforge egg id in your .env

```
# BUN STUFF CURSEFORGE
CURSEFORGE_API_KEY=
CURSEFORGE_GENERIC_EGG_ID=
```

## 🤤🤤🤤 Plugins installer

- idk no extra steps required unless API dies

## 🤤🤤🤤 Container splitter

Features:
    
- Create containers
- Delete containers
- Edit game type
- Sync subuser permissions

Manage resource limits for each user using set config options from WHMCS. Append and fill the following lines to `.env`:
```
WHMCS_HOST=
WHMCS_PORT=
WHMCS_DATABASE_USER=
WHMCS_DATABASE_PASSWORD=
WHMCS_DATABASE_NAME=
```
(It is recommended to create a READ-ONLY user with SELECT privileges only on your WHMCS MySQL database.)

![Image](https://cdn1.cdn.pet/n6EXnlOvgvMCBFP.gif)

# Description

Pterodactyl® is a free, open-source game server management panel built with PHP, React, and Go. Designed with security 
in mind, Pterodactyl runs all game servers in isolated Docker containers while exposing a beautiful and intuitive
UI to end users.

Stop settling for less. Make game servers a first class citizen on your platform.

![Image](https://cdn.pterodactyl.io/site-assets/pterodactyl_v1_demo.gif)

## Documentation

* [Panel Documentation](https://pterodactyl.io/panel/1.0/getting_started.html)
* [Wings Documentation](https://pterodactyl.io/wings/1.0/installing.html)
* [Community Guides](https://pterodactyl.io/community/about.html)
* Or, get additional help [via Discord](https://discord.gg/pterodactyl)

## Sponsors

I would like to extend my sincere thanks to the following sponsors for helping fund Pterodactyl's developement.
[Interested in becoming a sponsor?](https://github.com/sponsors/matthewpi)

| Company                                                   | About                                                                                                                                                                                                                           |
|-----------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [**WISP**](https://wisp.gg)                               | Extra features.                                                                                                                                                                                                                 |
| [**RocketNode**](https://rocketnode.com/)                 | Innovative game server hosting combined with a straightforward control panel, affordable prices, and Rocket-Fast support.                                                                                                       |
| [**Aussie Server Hosts**](https://aussieserverhosts.com/) | No frills Australian Owned and operated High Performance Server hosting for some of the most demanding games serving Australia and New Zealand.                                                                                 |
| [**BisectHosting**](https://www.bisecthosting.com/)       | BisectHosting provides Minecraft, Valheim and other server hosting services with the highest reliability and lightning fast support since 2012.                                                                                 |
| [**MineStrator**](https://minestrator.com/)               | Looking for the most highend French hosting company for your minecraft server? More than 24,000 members on our discord trust us. Give us a try!                                                                                 |
| [**Skynode**](https://www.skynode.pro/)                   | Skynode provides blazing fast game servers along with a top-notch user experience. Whatever our clients are looking for, we're able to provide it!                                                                              |
| [**VibeGAMES**](https://vibegames.net/)                   | VibeGAMES is a game server provider that specializes in DDOS protection for the games we offer. We have multiple locations in the US, Brazil, France, Germany, Singapore, Australia and South Africa.                           |
| [**Pterodactyl Market**](https://pterodactylmarket.com/)  | Pterodactyl Market is a one-and-stop shop for Pterodactyl. In our market, you can find Add-ons, Themes, Eggs, and more for Pterodactyl.                                                                                         |
| [**UltraServers**](https://ultraservers.com/)             | Deploy premium games hosting with the click of a button. Manage and swap games with ease and let us take care of the rest. We currently support Minecraft, Rust, ARK, 7 Days to Die, Garys MOD, CS:GO, Satisfactory and others. |
| [**Realms Hosting**](https://realmshosting.com/)          | Want to build your Gaming Empire? Use Realms Hosting today to kick start your game server hosting with outstanding DDOS Protection, 24/7 Support, Cheap Prices and a Custom Control Panel.                                      |                                                                                                                                                                                                                                |

### Supported Games

Pterodactyl supports a wide variety of games by utilizing Docker containers to isolate each instance. This gives
you the power to run game servers without bloating machines with a host of additional dependencies.

Some of our core supported games include:

* Minecraft — including Paper, Sponge, Bungeecord, Waterfall, and more
* Rust
* Terraria
* Teamspeak
* Mumble
* Team Fortress 2
* Counter Strike: Global Offensive
* Garry's Mod
* ARK: Survival Evolved

In addition to our standard nest of supported games, our community is constantly pushing the limits of this software
and there are plenty more games available provided by the community. Some of these games include:

* Factorio
* San Andreas: MP
* Pocketmine MP
* Squad
* Xonotic
* Starmade
* Discord ATLBot, and most other Node.js/Python discord bots
* [and many more...](https://github.com/parkervcp/eggs)

## License

Pterodactyl® Copyright © 2015 - 2022 Dane Everitt and contributors.

Code released under the [MIT License](./LICENSE.md).
