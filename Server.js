//create http server object & make it listen on port
//pass the http server object to websocket object
//constructor
//if the msg received from client is 'request' to uupgrade to websocket protocol, accept it
//create unique connect8ion with the client
//send and received message with the client using connection object.

const { json } = require('stream/consumers')

var clients = {}//client data structure
var games = {} //game data structure
//create websocket server and accept connection with the client.
const http = require('http').createServer().listen(8080, console.log('listening on port 8080'))
const server = require('websocket').server
const socket = new server({ 'httpServer': http })
const WIN_STATE = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]

socket.on('request', (request) => {
    const connection = request.accept(null, request.origin)
    const clientID = Math.round(Math.random() * 100) + Math.round(Math.random() * 100) + Math.round(Math.random() * 100)
    //create unique client ID
    clients[clientID] = { 'connection': connection }
    connection.send(JSON.stringify({
        'tag': 'connected',
        'clientID': clientID
    }))
    sendAvailableGames()
    connection.on('message', onMessage)

})

function sendAvailableGames() {
    const gamesList = []
    for (const game in games) {
        if (games[game].players.length < 2) {
            gamesList.push(game)
        }
    }

    for (const client in clients)
        clients[client].connection.send(JSON.stringify({
            'tag': 'gamesList',
            'list': gamesList
        }))

}
function onMessage(msg) {
    const data = JSON.parse(msg.utf8Data)
    switch (data.tag) {
        case 'create':
            const gameID = Math.round(Math.random() * 100) + Math.round(Math.random() * 100) + Math.round(Math.random() * 100)
            const gameBoard = ['', '', '', '', '', '', '', '', '']
            var player = {
                'clientID': data.clientID,
                'playerSign': 'X',
                'myTurn': true
            }
            const players = Array(player)
            games[gameID] = {
                'gameBoard': gameBoard,
                'players': players
            }
            clients[data.clientID].connection.send(JSON.stringify({
                'tag': 'created',
                'gameID': gameID
            }))
            sendAvailableGames()
            break
        case 'join':
            player = {
                'clientID': data.clientID,
                'playerSign': 'O',
                'myTurn': false
            }
            games[data.gameID].players.push(player)
            sendAvailableGames()
            games[data.gameID].players.forEach(player => {
                clients[player.clientID].connection.send(JSON.stringify({
                    'tag': 'joined',
                    'gameID': data.gameID,
                    'playerSign': player.playerSign
                }))

            })
            updateGameBoard(data.gameID)
            break
        case 'moveMade':
            games[data.gameID].gameBoard = data.gameBoard//update board
            console.log(games[data.gameID].gameBoard)
            console.log(games.gameBoard)
            const isWinner = winState(data.gameID)
            const isDraw = drawState(data.gameID)
            if (isWinner) {
                games[data.gameID].players.forEach(player => {
                    clients[player.clientID].connection.send(JSON.stringify({
                        'tag': 'winner',
                        'winner': player.playerSign
                    }))
                })
            }
            else if (isDraw) {
                games[data.gameID].players.forEach(player => {
                    clients[player.clientID].connection.send(JSON.stringify({
                        'tag': 'gameDraw',
                    }))
                })

            }
            else {
                games[data.gameID].players.forEach(player => {
                    player.myTurn = !player.myTurn
                })
                updateGameBoard(data.gameID)
            }
            break
    }
}
function updateGameBoard(gameID) {
    games[gameID].players.forEach(player => {
        clients[player.clientID].connection.send(JSON.stringify({
            'tag': 'updateGameBoard',
            'myTurn': player.myTurn,
            'gameBoard': games[gameID].gameBoard
        }))

    })
}
function winState(gameID) {
    return WIN_STATE.some(row => {
        return (row.every(cell => {
            return games[gameID].gameBoard[cell] == 'X'
        }) || row.every(cell => {
            return games[gameID].gameBoard[cell] == 'O'
        }))

    })
}

function drawState(gameID) {
    return WIN_STATE.every(row => {
        return (row.some(cell => {
            return games[gameID].gameBoard[cell] == 'X'
            }) && row.some(cell => {
                return games[gameID].gameBoard[cell] == 'O'
            })
        )
    })

}