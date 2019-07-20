const EventEmitter = require("events");
const express = require("express");

const ExtraZoneParam = require("./rnet/extraZoneParam");

class WebHookServer extends EventEmitter {
    constructor(port, password, rNet) {
        super();

        if (!password) {
            console.warn("To use enable Web Hooks, set \"webHookPassword\" in config.json");
            return;
        }

        this._port = port;
        this._app = express();

        this._app.use(express.json())
        this._app.use(function(req, res, next) {
            if (req.query.pass != password) {
                res.sendStatus(401);
                console.warn("[Web Hook] Bad password in request.");
            }
            else {
                next();
            }
        });

        this._app.use(function(req, res, next) {
            if (!rNet.isConnected()) {
                res.type("txt").status(503).send("RNet not connected.");
            }
            else {
                next();
            }
        });

        this._app.put("/on", function(req, res) {
            rNet.setAllPower(true);
            res.sendStatus(200);
        });

        this._app.put("/off", function(req, res) {
            rNet.setAllPower(false);
            res.sendStatus(200);
        });

        this._app.put("/mute", function(req, res) {
            rNet.setAllMute(true, 1000);
            res.sendStatus(200);
        });

        this._app.put("/unmute", function(req, res) {
            rNet.setAllMute(false, 1000);
            res.sendStatus(200);
        });

        this._app.use("/:zone/*", function(req, res, next) {
            const zone = rNet.findZoneByName(req.params.zone);
            if (zone) {
                req.zone = zone;
                next();
            }
            else {
                console.warn("[Web Hook] Unknown zone " + req.params.zone + ".");
                res.sendStatus(404);
            }
        })

        this._app.put("/:zone/volume/:volume", function(req, res) {
            req.zone.setVolume(Math.floor(parseInt(req.params.volume) / 2) * 2);
            res.sendStatus(200);
        });

        this._app.put("/:zone/source/:source", function(req, res) {
            const sourceID = rNet.findSourceIDByName(req.params.name);
            if (sourceID !== false) {
                req.zone.setSourceID(sourceID);
                res.sendStatus(200);
            }
            else {
                res.sendStatus(404);
            }
        });

        this._app.put("/:zone/mute", function(req, res) {
            req.zone.setMute(true, 1000);
            res.sendStatus(200);
        });

        this._app.put("/:zone/unmute", function(req, res) {
            req.zone.setMute(false, 1000);
            res.sendStatus(200);
        });

        this._app.get("/:zone/power", function(req, res) {
            res.status(200).send({"power": req.zone.getPower()});
        });

        this._app.put("/:zone/power", function(req, res) {
            req.zone.setPower(req.body.power);
            res.sendStatus(200);
        });

        this._app.get("/:zone/muted", function(req, res) {
            res.status(200).send({"muted": req.zone.getMuted()});
        });

        this._app.put("/:zone/muted", function(req, res) {
            req.zone.setMute(req.body.muted);
            res.sendStatus(200);
        });

        this._app.get("/:zone/volume", function(req, res) {
            res.status(200).send({"volume": req.zone.getVolume()});
        });

        this._app.put("/:zone/volume", function(req, res) {
            req.zone.setVolume(Math.floor(parseInt(req.body.volume) / 2) * 2);
            res.sendStatus(200);
        });

        this._app.get("/:zone/source", function(req, res) {
            res.status(200).send({"source": rNet.getSource(req.zone.getSourceID()).getName()});
        });

        this._app.put("/:zone/source", function(req, res) {
            const sourceID = rNet.findSourceIDByName(req.body.source);
            if (sourceID !== false) {
                req.zone.setSourceID(sourceID);
                res.sendStatus(200);
            }
            else {
                res.sendStatus(404);
            }
        });

        this._app.get("/sources", function(req, res) {
            res.status(200).send({"sources": rNet.getSources().map(x => x.getName())});
        });

        this._app.get("/zones", function(req, res) {
            var zones = [];
            for (let ctrllrID = 0; ctrllrID < rNet.getControllersSize(); ctrllrID++)
                for (let zoneID = 0; zoneID < rNet.getZonesSize(ctrllrID); zoneID++)
                    zones.push(rNet.getZone(ctrllrID, zoneID).getName());

            res.status(200).send({"zones": zones});
        });

        this._app.get("/:zone/status", function(req, res) {
            res.status(200).send({
                "power": req.zone.getPower(),
                "controllerID": req.zone.getControllerID(),
                "zoneID": req.zone.getZoneID(),
                "volume": req.zone.getVolume(),
                "maxVolume": req.zone.getMaxVolume(),
                "muted": req.zone.getMuted(),
                "source": rNet.getSource(req.zone.getSourceID()).getName(),
                "bass": req.zone.getParameter(ExtraZoneParam.BASS),
                "treble": req.zone.getParameter(ExtraZoneParam.TREBLE),
                "loudness": req.zone.getParameter(ExtraZoneParam.LOUDNES),
                "balance": req.zone.getParameter(ExtraZoneParam.BALANCE),
                "turn_on_volume": req.zone.getParameter(ExtraZoneParam.TURN_ON_VOLUME),
                "do_not_disturb": req.zone.getParameter(ExtraZoneParam.DO_NOT_DISTURB),
                "party_mode": req.zone.getParameter(ExtraZoneParam.PARTY_MODE),
            });
        });
    }

    start() {
        if (this._app) {
            this._server = this._app.listen(this._port);
            console.info("Web hook server running on port " + this._port);
        }
    }

    stop() {
        if (this._app && this._server) {
            this._server.close();
            this._server = undefined;
            console.info("Web hook server stopped.");
        }
    }
}

module.exports = WebHookServer;
