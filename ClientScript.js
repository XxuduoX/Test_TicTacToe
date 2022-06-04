//create websocket object
//pass URL and port no. of the server you want to connect to
//Every time server sneds a message to client,onmessage event is triggered
//to send msg to server, send method of the websocket
//object is used

var clientID
var gameID
var socket
var playerSign

const functionBar = document.querySelector('.functionBar')
const connect = document.querySelector('.connectBtn')
const create = document.querySelector('.createBtn')
const join = document.querySelector('.joinBtn')
const list = document.querySelector('ul')
const gameBoard = document.querySelector('.gameBoard')
const cells = document.querySelectorAll('.cell')
const intro=document.querySelectorAll('.intro')

join.disabled = true
create.disabled = true

connect.addEventListener('click', (src) => {
    socket = new WebSocket('ws://localhost:8080')// String->URL&port number that websocket is listening to
    socket.onmessage = onMessage
    src.target.disabled = true
})//request connect to the server


function onMessage(msg) {
    const data = JSON.parse(msg.data)//tag & clientID will be store here
    switch (data.tag) {
        case 'connected':
            console.log(data.clientID)
            clientID = data.clientID
            const lbl = document.createElement('label')
            lbl.innerText = 'Player ID:' + data.clientID
            lbl.style.textAlign = 'center'
            functionBar.insertBefore(lbl, connect)
            create.disabled = false
            join.disabled = false
            connect.disabled = true
            break
        case 'gamesList':
            console.log(data.list)
            const games = data.list

            while (list.firstChild) {
                list.removeChild(list.lastChild)
            }

            games.forEach(game => {
                const li = document.createElement('li')
                li.innerText = 'room: ' + game
                li.style.textAlign = 'center'
                list.appendChild(li)
                li.addEventListener('click', () => { gameID = game })
            })
            break
        case 'created':
            gameID = data.gameID
            create.disabled = true
            join.disabled = true
            console.log(gameID)
            break
        case 'joined':
            document.querySelector('.gameBoard').style.display = 'grid'
            document.querySelector('.intro').style.display='none';
            playerSign = data.playerSign
            if (playerSign == 'X') {
                gameBoard.classList.add('cross')
            } else {
                gameBoard.classList.add('circle')
            }
            break
        case 'updateGameBoard':
            cells.forEach(cell => {
                if (cell.classList.contains('cross')) {
                    cell.classList.remove('cross')
                }
                else if (cell.classList.contains('circle')) {
                    cell.classList.remove('circle')

                }

            })
            for (i = 0; i < 9; i++) {
                if (data.gameBoard[i] == 'X') {
                    cells[i].classList.add('cross')
                }
                else if (data.gameBoard[i] == 'O')
                    cells[i].classList.add('circle')
            }
            if (data.myTurn) {
                makeMove()
            }
            break
        case 'winner':
            winner=data.winner
            alert('The winner is '+winner)
            break
        case 'gameDraw':
            alert('The game is a Draw')
            break

    }
}
function makeMove() {
    cells.forEach(cell => {
        if (!cell.classList.contains('cross') && !cell.classList.contains('circle')) {
            cell.addEventListener('click', cellClicked)
        }
    })

}
function cellClicked(src) {
    let sign
    if (playerSign == 'X') {
        sign = 'cross'
    } else {
        sign = 'circle'
    }
    src.target.classList.add(sign)
    const gameBoard = []
    for (i = 0; i < 9; i++) {
        if (cells[i].classList.contains('circle')) {
            gameBoard[i] = 'O'
        } else if (cells[i].classList.contains('cross')) {
            gameBoard[i] = 'X'
        } else {
            gameBoard[i] = ''
        }

    }
    cells.forEach(cell => {
        cell.removeEventListener('click', cellClicked)
    })
    socket.send(JSON.stringify({
        'tag': 'moveMade',
        'gameBoard': gameBoard,
        'clientID': clientID,
        'gameID': gameID
    }))
}
create.addEventListener('click', () => {
    socket.send(JSON.stringify({
        'tag': 'create',
        'clientID': clientID
    }))
})
join.addEventListener('click', () => {
    socket.send(JSON.stringify({
        'tag': 'join',
        'clientID': clientID,
        'gameID': gameID
    }))
})
