import http from 'http'
import fs from 'fs'

import WebSocket, { WebSocketServer } from 'ws'

// const server = http.createServer()
const server = http.createServer(httpHandler)

const wss = new WebSocketServer({
    server
})

const port = 8000

const clients = {}
const games = {}

let timer = null

server.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

wss.on('connection', function connection(ws){

    ws.on('open', () => console.log('opened'))

    ws.on('close', () => console.log('closed'))

    ws.on('message', (data) => {

        // const result = JSON.parse(data.utf8Data)
        const result = JSON.parse(data)
        console.log(result)

        if (result.method === "create"){
            const clientId = result.clientId
            const gameId = uuidv4()

            games[gameId] = {
                "id": gameId,
                "balls": 20,
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "game": games[gameId] 
            }

            ws.send(JSON.stringify(payLoad))
        }

        if (result.method === "join"){
            const clientId = result.clientId
            const gameId = result.gameId

            const game = games[gameId]

            if (game.clients.length >= 3)
            {
                console.log("max players reach!")
                return
            }

            const color = {
                "0": "Red",
                "1": "Green",
                "2": "Blue"
            }[game.clients.length]

            game.clients.push({
                "clientId": clientId,
                "color": color
            })

            if (game.clients.length === 3) updateGameState()

            const payLoad = {
                "method": "join",
                "game": game
            }

            console.log('join ->' , payLoad, game.clients)

            wss.clients.forEach(function each(client){
                if (client.readyState === WebSocket.OPEN){
                    client.send(JSON.stringify(payLoad))
                }
            })

        }

        if (result.method === "play"){
            const gameId = result.gameId
            const ballId = result.ballId
            const color = result.color

            let state = games[gameId].state

            if (!state)
                state = {} // is an object-key-value pair
            
            state[ballId] = color
            games[gameId].state = state

        }

        if (result.method == "end"){
              if (timer){ 
                  clearTimeout(timer)
                  timer = null
              }
        }

    }) 


    const clientId = uuidv4()

    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }

    ws.send(JSON.stringify(payLoad))

})


function uuidv4() {
    return '00-0-4-1-000'.replace(/[^-]/g,
            s => ((Math.random() + ~~s) * 0x10000 >> s).toString(16).padStart(4, '0')
    );
}

function httpHandler(req, res){
    fs.readFile('./public' + req.url, function (err, data){
        if (err == null){
            res.writeHead(200, {'Content-Type':'text/html'})
            res.write(data)
            res.end()
        }
    })
}

function updateGameState(){

    //{"gameid", fasdfsf}
    for ( const g of Object.keys(games)){
        const game = games[g]

        const payLoad = {
            "method": "update",
            "game": game
        }

        // game.clients.forEach(c => {
        // })

        wss.clients.forEach(function each(client){
            if (client.readyState === WebSocket.OPEN){
                client.send(JSON.stringify(payLoad))
            }
        })
    }

    setTimeout(updateGameState, 500)
    // timer = setTimeout(updateGameState, 500)

}
