const {query} = require('gamedig');

const {Router} = require('express');


const {CheckAuth, CheckServerAuth} = require('./AuthChecker')
const log = require("./log");


const router = Router();

router.post('/Status/:ip/:port/:auth', (req, res)=>{
    GetServerStatus(req, res, req.params.ip, req.params.port, req.params.auth);
});

async function QueryServer(ip, port){
    try{
        let data = query({
            type: 'dayz',
            host: ip,
            port: port
        }).then((state) =>{
            //console.log(state);
            let keywords = state.raw.tags.split(',');
            return {
                ip: state.connect.split(':')[0],
                query_port: parseInt(port),
                game_port: parseInt(state.connect.split(':')[1]),
                status: "Online",
                name: state.name,
                version: state.raw.version,
                players: state.raw.numplayers,
                queue: parseInt(keywords.find(tag => tag.includes('lqs')).replace('lqs', '')),
                max_players: state.maxplayers,
                time: keywords.find(tag => tag.includes(':')),
                first_person: keywords.some(tag => tag.includes('no3rd')),
                map: state.map,
                time_acceleration: parseFloat((keywords.find(tag => tag.includes('etm')) || '12').replace('etm', '')) + ", " + parseFloat((keywords.find(tag => tag.includes('entm')) || '1').replace('entm', '')),
                day_time_acceleration: parseFloat((keywords.find(tag => tag.includes('etm')) || '12').replace('etm', '')),
                night_time_acceleration: parseFloat((keywords.find(tag => tag.includes('entm')) || '1').replace('entm', '')),
                password: state.password,
                battleye: keywords.some(tag => tag.includes('battleye')),
                vac: state.raw.secure == 1,
                public_hive: !keywords.some(tag => tag.includes('privHive')),
                dlc_enabled: keywords.some(tag => tag.includes('isDLC')),
                ping: state.ping
            }
        }
        ).catch((error) => {
            log(error, "warn");
            return {ip: ip, query_port: parseInt(port), status: "offline", error: "Server is offline or wrong ip/query port"};
        });
        theData = await data;
        return theData;
    } catch (error){
        log(error, "warn");
        return {ip: ip, query_port: parseInt(port), status: "offline", error: "Server is offline or wrong ip/query port"};
    }
};



async function GetServerStatus(req, res, ip, port, auth){
    if (CheckServerAuth(auth) || ( await CheckAuth(auth) ) ){
        let response;
        let isSent = false;
        try {
            response =  await QueryServer(ip, port);
            if (response.error === undefined) {
                let statusobj = {
                    Status: response.status,
                    Error: "", 
                    ip: response.ip,
                    gamePort: response.game_port,
                    queryPort: response.query_port,
                    name: response.name,
                    version: response.version,
                    players: response.players,
                    queue: response.queue,
                    maxPlayers: response.max_players,
                    time: response.time,
                    world: response.map,
                    password: response.password ? 1 : 0,
                    firstPerson: response.first_person ? 1 : 0
                }
                isSent = true;
                res.status(200);
                res.json(statusobj);

                return;
            }
        } catch (e) {
            log(e, "warn");
        }
            if(isSent) return;
             res.status(200);
             res.json( {
                Status: "Offline",
                Error: response.error || "Error Unknown", 
                ip: ip,
                gamePort: -1,
                queryPort: parseInt(port),
                name: "",
                version: "",
                players: 0,
                queue: 0,
                maxPlayers: 0,
                time: "",
                world: "",
                password: 0,
                firstPerson: 0
            });
            return;
    } else {
        res.status(401);
        res.json({Status: "NoAuth", Error: "" });
        return;
    }
}

module.exports = router;