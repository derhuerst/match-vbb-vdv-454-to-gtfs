# match-vbb-vdv-454-to-gtfs

Try to **match [VBB](https://vbb.de)'s VDV-453/VDV-454 realtime transit data with their [GTFS Static](https://gtfs.org/reference/static) feed**, even if they don't share IDs.

[![npm version](https://img.shields.io/npm/v/match-vbb-vdv-454-to-gtfs.svg)](https://www.npmjs.com/package/match-vbb-vdv-454-to-gtfs)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/match-vbb-vdv-454-to-gtfs.svg)
![minimum Node.js version](https://img.shields.io/node/v/match-vbb-vdv-454-to-gtfs.svg)


## Installation

```shell
npm install match-vbb-vdv-454-to-gtfs
```

*Note:* `match-vbb-vdv-454-to-gtfs` **needs PostgreSQL >=14** to work, as its dependency [`gtfs-via-postgres`](https://github.com/derhuerst/gtfs-via-postgres) needs that version. You can check your PostgreSQL server's version with `psql -t -c 'SELECT version()'`.


## Usage

todo


## Contributing

*Note:* This repos blends two families of techinical terms – GTFS-related ones and [FPTF](https://public-transport.github.io/friendly-public-transport-format/)-/[`hafas-client`](https://github.com/public-transport/hafas-client)-related ones –, which makes the code somewhat confusing.

If you have a question or need support using `match-vbb-vdv-454-to-gtfs`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/match-vbb-vdv-454-to-gtfs/issues).
