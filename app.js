const grid = document.querySelector('.grid')
const scoreDisplay = document.getElementById('score')
const gameInfo = document.querySelector('.info')
const instruction = document.querySelector('.instruction')
const powerUpSquares = document.querySelectorAll('.square')
const toggleSoundElement = document.querySelector('.toggle-sound')

const width = 28
let squares = []
let ghostPositions = []
let currentIndex = null
let lastIndex = null


let game
let counter = 0
const maxGhosts = 12


let gameStarted = false
let gameFinished = false
let gamePaused = false

let powerUps = [null,null,null]
let powerUpPointer = null
let drillingSquares = []
let fireSquares     = []
let portals = [undefined, undefined, undefined]
let portalMovement = undefined

let pressedMovementKey = undefined

let currentMap 
let currentMapIndex = 0

let soundsOn = true

let moveKeysCurrentlyPressed = [false,false,false,false]

let score = 0

const dir = {left:-1, right:+1, up: -width, down: +width}
const dirArray = [dir.left, dir.up, dir.right, dir.down]


let pacDotsRemain = 0

//instructions 
let haveMoved = false
let haveUsedPowerUp = false
let haveChangedPowerUp = false
let haveUsedDrill = false
let haveUsedPortal = false
let savedInstruction

let ghosts = []

class Ghost {
    //random movement priority
    movePriority = [dir.left, dir.right, dir.up, dir.down].sort((a,b) => Math.random() - 0.5)

    constructor(position){
        this.position = position
        this.prevPos = undefined
    }
    
    moveGhost(){
        for(let i = 0; i < this.movePriority.length; i++){
            if (canMoveHere(this.position, this.position  + this.movePriority[i]) &&
                !squares[this.position + this.movePriority[i]].classList.contains('ghost')){
                this.prevPos = this.position
                this.position = this.position + this.movePriority[i]
                this.updateMovePriority(i) 
                return
            }
        }
    }

    // the opposite direction to the current direction is put last in the movePriority array 
    updateMovePriority(moveIndex){
        let oppositeDirection = this.getOppositeDirection(moveIndex)
        this.movePriority.splice(this.movePriority.indexOf(oppositeDirection),1)
        this.movePriority.push(oppositeDirection)
    }

    //return the opposite direction 
    getOppositeDirection(moveIndex){
        switch(this.movePriority[moveIndex])
        {
            case dir.left:
                return dir.right; 
            case dir.right:
                return dir.left;
            case dir.up:
                return dir.down;
            case dir.down:
                return dir.up
        }
    }

    shuffleMovement(){
        //shuffle three first and keep opposite last 
        let oppositeDir = this.movePriority.splice(3,1)[0];
        this.movePriority.sort((a,b) => Math.random() - 0.5)
        this.movePriority.push(oppositeDir)
    }
}


class MusicPlayer{

    gameMusicPlaying = false
    fireSoundPlaying = false
    gameWonMusicPlaying = false
    soundsOff = false

    constructor(gameMusic, coinSound, fireSound, ghostDeathSound, gameOverSound, buildWallSound, drillSound, powerUpSound, 
            mapClearedMusic,portalSound,portalMoveSound,gameWonMusic){
        this.gameMusic = new Audio(gameMusic)
        this.gameMusic.volume = 0.043
        this.gameMusic.loop = true
        this.fireSound = new Audio(fireSound)
        this.fireSound.volume = 0.01
        this.fireSound.loop = true
        this.ghostDeathSound = new Audio(ghostDeathSound)
        this.ghostDeathSound.volume = 0.1
        this.gameOverSound = new Audio(gameOverSound)
        this.gameOverSound.volume = 0.035
        this.buildWallSound = new Audio(buildWallSound)
        this.buildWallSound.volume = 0.02
        this.drillSound  = new Audio(drillSound)
        this.drillSound.volume = 0.03
        this.powerUpSound = new Audio(powerUpSound)
        this.powerUpSound.volume = 0.01
        this.coinSound = new Audio(coinSound)
        this.coinSound.volume = 0.015
        this.portalSound = new Audio(portalSound)
        this.portalSound.volume = 0.04
        this.portalMoveSound = new Audio(portalMoveSound)
        this.portalMoveSound.volume = 0.03
                
        this.mapClearedMusic = new Audio(mapClearedMusic)
        this.mapClearedMusic.volume = 0.02
        this.gameWonMusic = new Audio(gameWonMusic)
        this.gameWonMusic.volume = 0.03
    }

    playGameMusic(){
        this.gameMusic.play()
        this.gameMusicPlaying = true
    }

    pauseGameMusic(){
        this.gameMusic.pause()
        this.gameMusicPlaying = false
    }

    stopGameMusic(){
        this.pauseGameMusic()
        this.gameMusic.currentTime = 0
    }

    playMapClearedMusic(){
        this.mapClearedMusic.play()
        this.mapClearedMusicPlaying = true 
    }

    stopMapClearedMusic(){
        this.mapClearedMusic.pause()
        this.mapClearedMusic.currentTime = 0 
        this.mapClearedMusicPlaying = false
    }

    playGameWonMusic(){
        this.gameWonMusic.play()
        this.gameWonMusicPlaying = true
    }

    stopGameWonMusic(){
        this.gameWonMusic.pause()
        this.gameWonMusic.currentTime = 0
        this.gameWonMusicPlaying = false
    }

    playGameOverSound(){
        if (this.soundsOff) return
        this.gameOverSound.play()
    }

    playCoinSound(){
        if (this.soundsOff) return

        if (this.coinSound.paused){
            this.coinSound.play()
        }
        else{
            let tempSound = this.coinSound.cloneNode()
            tempSound.volume = 0.015
            tempSound.play()
        }
    }

    playPowerUpSound(){
        if (this.soundsOff) return
        if (this.powerUpSound.paused){
            this.powerUpSound.play()
        }
        else{
            let tempSound = this.powerUpSound.cloneNode()
            tempSound.volume = 0.01
            tempSound.play()
        }
    }

    playBuildWallSound(){
        if (this.soundsOff) return
        this.buildWallSound.play()
    }

    playdrillSound(){
        if (this.soundsOff) return
        this.drillSound.play()
    }

    playFireSound(){
        this.fireSound.play()
        this.fireSoundPlaying = true
    }

    stopFireSound(){
        this.fireSound.pause()
        this.fireSound.currentTime = 0
        this.fireSoundPlaying  = false
    }

    playPortalSound(){
        if(this.soundsOff) return
        this.portalSound.play()
    }

    playPortalMovementSound(){
        if(this.soundsOff) return
        this.portalMoveSound.play()
    }

    playGhostDeathSound(){
        if (this.soundsOff) return
        let tempSound = this.ghostDeathSound.cloneNode()
        tempSound.volume = 0.1
        tempSound.play()
    }    

    setVolume(){
        this.soundsOff = !this.soundsOff
        if (this.soundsOff){
            this.gameMusic.volume = 0
            this.gameWonMusic.volume = 0
            this.fireSound.volume = 0
            this.mapClearedMusic.volume = 0
        }
        else{
            this.gameMusic.volume = 0.043
            this.gameWonMusic.volume = 0.02
            this.fireSound.volume = 0.01
            this.mapClearedMusic.volume = 0.02
        }
    }
}

mp = new MusicPlayer('resources/music/Komiku-Skate.mp3', 
                     'resources/music/sfx_sounds_pause1_in.mp3',
                     'resources/music/fireburn.mp3',
                     'resources/music/sfx_deathscream_alien3.wav',
                     'resources/music/mixkit-cartoon-whistle-game-over-606.wav',
                     'resources/music/sfx_sounds_impact11.wav',
                     'resources/music/sfx_sounds_impact14.wav',
                     'resources/music/sfx_sounds_powerup2.wav',
                     'resources/music/Origami Repetika - Love Your Handy Hands.mp3',
                     'resources/music/sfx_sound_mechanicalnoise3.wav',
                     'resources/music/sfx_sound_neutral8.wav',
                     'resources/music/end_music.mp3')



function toggleSounds(){
    mp.setVolume()
    if (mp.soundsOff){
        toggleSoundElement.innerHTML = "SOUND OFF"
    }
    else{
        toggleSoundElement.innerHTML = "SOUND ON"
    }
}
toggleSoundElement.addEventListener('click', toggleSounds)


function createBoard(){
    currentMap = maps[currentMapIndex]
    currentIndex = currentMap.startIndex

    for (let i=0; i < currentMap.layout.length; i++){
        const square = document.createElement('div')
        
        switch(currentMap.layout[i])
        {
        case 0:
            square.classList.add('pac-dot')
            pacDotsRemain++;
            break;
        case 1:
            square.classList.add('wall')
            break;
        case 3:
            square.classList.add('power-up-map')
            break;
        case 5:
            square.classList.add('outer-wall')
        }
        grid.appendChild(square)
        squares.push(square)
  }
  squares[currentIndex].classList.add('pac-man')
  addGhosts(currentMap.numStartingGhosts, startingGhost = true)
}

function recreateBoard(){
    while(grid.hasChildNodes()){
        grid.removeChild(grid.lastChild);
    }
    createBoard()
}

function addGhosts(num, startingGhost = false){
    for (let i = 0; i < num; i++){
        if (startingGhost){
            ghosts.push(new Ghost(currentMap.startingGhostPosition[i]))
        }
        else{
            ghosts.push(new Ghost(currentMap.newGhostPosition))
        }
    }
}


function controller(e){
    
    if (e.keyCode === 77){
        toggleSounds()
    }

    else if (!gameStarted && e.keyCode === 13){
        startGame()
    }
    else if (gameFinished && e.keyCode === 13){
        restartGame()
    }
    else if (gameStarted && !gameFinished && e.keyCode === 27){
        togglePause()
    }

    else if(gamePaused && e.key === "r"){
        gamePaused = false
        gameOver()
        restartGame()
    }

    else if (gameStarted && !gameFinished && !gamePaused){
        if(e.keyCode === 32){
            usePowerUp()
        }
        else if (e.keyCode >= 49 && e.keyCode <= 51){
            changeSelectedPowerUp(powerUpPointer, e.keyCode - 49)
        }
        else if (e.keyCode >= 37 && e.keyCode <= 40){
            if(pressedMovementKey === undefined){
                pressedMovementKey = e.keyCode
            }
            moveKeysCurrentlyPressed[e.keyCode-37] = true  
        }
    }   
}   

function startGame(){
    game = setInterval(gameLoop, 75);    
    instruction.innerHTML = ""
    gameStarted = true
    gameFinished = false
    mp.playGameMusic()
}

function togglePause(){
    gamePaused = !gamePaused 
    if (gamePaused){
        savedInstruction = instruction.innerHTML
        instruction.innerHTML = "Press ESC/R to unpause/restart game"
    }
    if (!gamePaused){
        instruction.innerHTML = savedInstruction
    }
}


function gameLoop(){
    if (gamePaused) return

    counter++;

    if (!haveMoved){
        instruction.innerHTML = "Move with arrowkeys"
    }

    //movement of pacman 
    if (portalMovement !== undefined){
        squares[currentIndex].classList.remove('pac-man')
        currentIndex = portalMovement
        squares[currentIndex].classList.remove('portal')
        squares[currentIndex].classList.add('pac-man')
        mp.playPortalMovementSound()
        lastIndex = undefined
        portalMovement = undefined
            
    }
    else if (pressedMovementKey!==undefined){
        move(pressedMovementKey)
        pressedMovementKey = undefined
    }
  

    if (counter % 3 === 0){
        moveGhosts();
    }

     //handle fire power-up
    if (counter % 7 === 0){
        handleFire()
    }

    checkGhostFire()

    if (checkCollision()){
        gameOver()
    }


    if (squares[currentIndex].classList.contains('power-up-map')){
        getPowerUp()
    }
    
    if(checkDot() && checkWinGame()){
    clearInterval(game)  
    gameFinished = true
    mp.stopGameMusic()
    if(mp.fireSoundPlaying) mp.stopFireSound()
    if (currentMapIndex === maps.length - 1){
        instruction.innerHTML = "Game won! Press Enter to play again!"
        currentMapIndex = 0
        mp.playGameWonMusic()
        } 
    else{
        instruction.innerHTML = "Map cleared! Press Enter for next map!"
        currentMapIndex += 1
        mp.playMapClearedMusic()
    } 
        
        
    }

    for(let i = 0; i < portals.length; i++){
        if(portals[i]!==undefined && portals[i].counter > 0){
            portals[i].counter--
        }
    }

    if (counter % 5 === 0){
        handleDrilling()
    }
   
    if (counter % 75 === 0){
        shuffleGhostMovement()
    }

    if(currentMap.newGhostInterval !== undefined && ghosts.length < maxGhosts &&
            counter % currentMap.newGhostInterval === 0){
        addGhosts(1);
    }
}


function checkGhostFire(){

    ghosts.forEach(ghost => {
        if(squares[ghost.position].classList.contains('fire')){
            squares[ghost.position].classList.remove('ghost')
            ghosts.splice(ghosts.indexOf(ghost),1)
            mp.playGhostDeathSound()
        }
    })
}
    

function gameOver(){
    instruction.innerHTML = "Press Enter to play again!"
    squares[currentIndex].classList.remove('pac-man')
    clearInterval(game)
    gameFinished = true
    mp.stopGameMusic()
    mp.playGameOverSound()
    if (mp.fireSoundPlaying){
        mp.stopFireSound()
    }
}


function restartGame(){
        score = 0
        pacDotsRemain = 0
        ghosts = []
        ghostPositions = []
        squares = []
        counter = 0; 
        gameFinished = false
        gameStarted = true
        fireSquares = []
        drillingSquares = []
        portals = [undefined,undefined,undefined]
        portalMovement = undefined

        powerUpSquares.forEach((square,index) => {
            if (powerUps[index] !== null){
                square.classList.remove('power-up-active','power-up-' + powerUps[index])
            }
        })
        powerUps = [null,null,null]
        powerUpPointer = null
    
        recreateBoard()
 
        game = setInterval(gameLoop, 75);    
        scoreDisplay.innerHTML = score
        instruction.innerHTML = ""
        console.log(mp.gameWonMusicPlaying)
        console.log(mp.gameWonMusicPlaying === true)
        console.log(mp.mapClearedMusicPlaying)
        console.log(mp.mapClearedMusicPlaying === true)
        
        if (mp.gameWonMusicPlaying){
            mp.stopGameWonMusic()
        }
        else if (mp.mapClearedMusicPlaying){
            mp.stopMapClearedMusic()
        }
        mp.playGameMusic()
        
}


function shuffleGhostMovement(){
    ghosts.forEach(ghost => {
        ghost.shuffleMovement()
    })
}

function moveGhosts(){
    ghosts.forEach(ghost => {
        squares[ghost.position].classList.remove('ghost')
        ghost.moveGhost();
        squares[ghost.position].classList.add('ghost')
    });
}

// check if player dies by colition with either ghost or fire
function checkCollision(){
    for(let i = 0; i < ghosts.length; i++){
        if (currentIndex === ghosts[i].position || 
            (lastIndex === ghosts[i].position && currentIndex ===ghosts[i].prevPos)){
            return true;
        }
    }
    if (squares[currentIndex].classList.contains('fire')){
        return true
    }
    return false; 
}

//game is won if no pac dots remain
function checkWinGame(){
    return !pacDotsRemain
}

// move player
function move(keyCode){
    let newPosition;
    if(canMoveHere(currentIndex, currentIndex + dirArray[keyCode-37])){
        newPosition = currentIndex + dirArray[keyCode-37]
        squares[currentIndex].classList.remove('pac-man')
        squares[newPosition].classList.add('pac-man')
        lastIndex = currentIndex
        currentIndex = newPosition
        if (!haveMoved){
            haveMoved = true
            instruction.innerHTML = ""
        }
    }
}

function checkDot(){
    if (squares[currentIndex].classList.contains('pac-dot')){
        squares[currentIndex].classList.remove('pac-dot')
        score += 1
        scoreDisplay.innerHTML = score
        pacDotsRemain--
        mp.playCoinSound()
        return true
    }
    return false
}

function canMoveHere(prevPos, newPos){
    //tries to move into wall
    if (squares[newPos].classList.contains('wall') || squares[newPos].classList.contains('outer-wall')){
        return false
    }

    //moves out of the grid upwards or downwards
    if (newPos<0 || newPos > width*width -1){
        return false
    }

    //moves left when in leftmost column
    if (prevPos % width === 0 && prevPos - newPos === 1){
        return false 
    }

    //moves right when in rightmost column
    if (prevPos % width === width - 1 && newPos - prevPos === 1){
        return false
    }
    
    //movement is possible
    return true
}


// ***************************
// ***************************
// Power-up functions
// ***************************
// ***************************

function getLowestFreePowerUpIndex(){
    for (let i = 0; i<powerUps.length;i++){
        if (powerUps[i] === null){
            return i
        }   
    }
    return null
}

function getLowestTakenPowerUpIndex(){
    for (let i = 0; i<powerUps.length;i++){
        if (powerUps[i] !== null){
            return i
        }   
    }
    return null
}

function powerUpInstruction(){
 
    let numPowerUps = 0 
    powerUps.forEach(pu => {
        if (pu!==null){numPowerUps++}
    }) 

    if (!haveChangedPowerUp && numPowerUps > 1){
        instruction.innerHTML = "Press 1-3 to switch power-up"
    }
    else if (numPowerUps > 0 && powerUps[powerUpPointer] === 'drill' && !haveUsedDrill){
        instruction.innerHTML = "Press spacebar and arrowkey to drill"
    }
    else if (numPowerUps > 0 && powerUps[powerUpPointer] === 'portal' && !haveUsedPortal){
        if (portals[powerUpPointer] === undefined){
            instruction.innerHTML = "Press spacebar to place portal"
        }
        else{
            instruction.innerHTML = "Press spacebar to move to portal"
        }
    }
    else if (numPowerUps > 0 && !haveUsedPowerUp && powerUps[powerUpPointer] !== 'drill' && powerUps[powerUpPointer] !== 'portal'){
        instruction.innerHTML = "Press spacebar to use power-up"
    }
    else {
        instruction.innerHTML = ""
    }
}

// executed when player moves to a square containing a power-up
function getPowerUp(){
    
    let powerUpIndex = getLowestFreePowerUpIndex()
    if (powerUpIndex === null) return
    
    // get the correct type of power-up
    let powerUpType = currentMap.mapPowerUps.find(pu => {
        return pu.index === currentIndex
    }).type

    powerUps[powerUpIndex] = powerUpType
    squares[currentIndex].classList.remove("power-up-map")   
    powerUpSquares[powerUpIndex].classList.add("power-up-" + powerUpType)
    
    if (powerUpPointer === null){
        powerUpPointer = 0
        powerUpSquares[powerUpPointer].classList.add("power-up-active")
    }   

    powerUpInstruction()
    mp.playPowerUpSound()
}

function usePowerUp(){
    if (powerUpPointer === null) return

    if (powerUps[powerUpPointer] === 'wall' && lastIndex !== undefined && !squares[lastIndex].classList.contains('wall')){
        squares[lastIndex].classList.add('wall')
        mp.playBuildWallSound()
        removePowerUp()
        haveUsedPowerUp = true
    }

    else if (powerUps[powerUpPointer] === 'drill'){

        for (let i = 0; i < moveKeysCurrentlyPressed.length;i++){
            if (moveKeysCurrentlyPressed[i] === true){
                let pressedDir = dirArray[i]
                if(squares[currentIndex+pressedDir].classList.contains('wall')){
                    startDrilling(pressedDir)
                    removePowerUp()
                    haveUsedDrill = true
                    break
                }
            }
        }
    }

    else if (powerUps[powerUpPointer] === 'fire'){
        fireSquares.push({index:currentIndex, new: true, ready: false, duration: 10})
        removePowerUp()
        haveUsedPowerUp = true 
    }

    else if (powerUps[powerUpPointer] === 'portal'){
        if (portals[powerUpPointer] === undefined){
            portals[powerUpPointer] = {index: currentIndex, counter: 12}
            squares[currentIndex].classList.add('portal')
            mp.playPortalSound()
        }
        else if (portals[powerUpPointer].counter === 0){
            portalMovement = portals[powerUpPointer].index
            prevIndex = undefined
            portals[powerUpPointer] = undefined
            haveUsedPortal = true
            removePowerUp()
        }
    }
    powerUpInstruction()
}

function removePowerUp(){
    powerUpSquares[powerUpPointer].classList.remove('power-up-active','power-up-' + powerUps[powerUpPointer])
    powerUps[powerUpPointer] = null
    
    powerUpPointer = getLowestTakenPowerUpIndex()
    if (powerUpPointer !== null){
        powerUpSquares[powerUpPointer].classList.add('power-up-active')
    }
}


function startDrilling(direction){
    let drillIndex = currentIndex + direction
    squares[drillIndex].classList.remove('wall')
    mp.playdrillSound()
    drillingSquares.push({index: drillIndex, dir: direction})
}

function handleDrilling(){
    let numEntries = drillingSquares.length
    for (let i = 0; i < numEntries; i++){
        let entry = drillingSquares.shift()
        let drillIndex = entry.index + entry.dir 
        if (squares[drillIndex].classList.contains('wall')){
            squares[drillIndex].classList.remove('wall')
            mp.playdrillSound()
            drillingSquares.push({index:drillIndex, dir: entry.dir })                   
        }
    }
}

function handleFire(){
    if (!mp.fireSoundPlaying && fireSquares.length > 0){
        mp.playFireSound()
    }
    let newFireSquares = []
    for (let i = fireSquares.length - 1; i >= 0; i--){
        if (!fireSquares[i].ready){
            fireSquares[i].ready = true
            newFireSquares.push({index: fireSquares[i].index, new:true, ready:true, duration:fireSquares[i].duration})
        }
        else if (fireSquares[i].duration === 0){
            squares[fireSquares[i].index].classList.remove('fire')
            
        }
        else if (fireSquares[i].new){
            let newDuration = fireSquares[i].duration - 1
            let index = fireSquares[i].index
            squares[index].classList.add('fire')
            dirArray.forEach(d => {
                    if (canMoveHere(index,index+d) && !squares[index+d].classList.contains('fire')){
                    newFireSquares.push({index:index+d, new: true, ready:true, duration: newDuration})}
            })
            newFireSquares.push({index:index, new: false, ready:true, duration: newDuration})
        }
        else {
            newFireSquares.push({index:fireSquares[i].index, new: false, ready:true, duration: fireSquares[i].duration - 1})
        }

    }
    fireSquares = newFireSquares
    if (fireSquares.length === 0){
        mp.stopFireSound()
    }
}


function changeSelectedPowerUp(prevIndex, newIndex){
    if (prevIndex === newIndex) return
   
    if (powerUps[newIndex] !== null){
        powerUpSquares[newIndex].classList.add('power-up-active')
        powerUpPointer = newIndex
        if (prevIndex !== null){
            powerUpSquares[prevIndex].classList.remove('power-up-active')
        }
        haveChangedPowerUp = true 
        powerUpInstruction()
    }
}


// ***************************
// ***************************
// Maps
// ***************************
// ***************************

const Map1 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,2,0,0,0,3,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,5,
    5,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,5,
    5,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 126, type: 'drill'},
                {index: 742, type: 'drill'}],
  numStartingGhosts: 3,
  startingGhostPosition: [350,679,497],
  newGhostInterval: undefined,
  startIndex: 122
}

const Map2 = {
    layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,5,
    5,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,5,
    5,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,0,1,1,4,1,1,1,2,2,1,1,1,4,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,1,5,
    5,4,4,4,4,4,0,0,0,4,1,2,2,2,2,2,2,1,4,0,0,0,4,4,4,4,4,5,
    5,1,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,5,
    5,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,5,
    5,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,5,
    5,3,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,3,5,
    5,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,5,
    5,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,5,
    5,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,5,
    5,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,5,
    5,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 85, type: 'wall'},  {index: 110, type: 'drill'},
                {index: 561, type: 'fire'}, {index: 586, type: 'drill'}],
  numStartingGhosts: 4,
  startingGhostPosition: [377,377,377,377],
  newGhostInterval: 250,
  newGhostPosition: 377,
  startIndex: 490
}

const Map3 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,3,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,5,
    5,1,1,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,3,0,0,0,0,0,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,5,
    5,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 145, type: 'portal'},
                {index: 164, type: 'drill'},{index:663, type:'drill'}, {index:563, type:'drill'}],
  numStartingGhosts: 4,
  startingGhostPosition: [163,228,395,706,],
  newGhostInterval: undefined,
  startIndex: 144
}

const Map4 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,3,3,3,3,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,2,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 125, type: 'wall'},  {index: 126, type: 'drill'},
                {index: 127, type: 'wall'},  {index: 378, type: 'fire'},  {index: 406, type: 'drill'}, {index: 128, type: 'portal'}],
  numStartingGhosts: 5,
  startingGhostPosition: [714,714,714,714,178],
  newGhostInterval: 90,
  newGhostPosition: 714,
  startIndex: 182
}

const Map5 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,5,
    5,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,5,
    5,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,4,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,4,5,
    5,4,1,1,1,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,1,1,1,4,5,
    5,4,1,1,1,1,0,1,1,4,1,1,1,2,2,1,1,1,4,1,1,0,1,1,1,1,4,5,
    5,4,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,4,5,
    5,4,4,4,4,4,0,0,0,4,1,2,2,2,2,2,2,1,4,0,0,0,4,4,4,4,4,5,
    5,4,1,1,1,1,0,1,1,4,1,0,0,0,0,0,0,1,4,1,1,0,1,1,1,1,4,5,
    5,4,1,1,1,1,0,1,1,4,1,1,1,2,2,1,1,1,4,1,1,0,1,1,1,1,4,5,
    5,4,1,1,1,1,0,1,1,4,1,1,1,2,2,1,1,1,4,1,1,0,1,1,1,1,4,5,
    5,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,5,
    5,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,5,
    5,3,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,3,5,
    5,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,5,
    5,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,5,
    5,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,5,
    5,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,5,
    5,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 85, type: 'fire'},  {index: 110, type: 'fire'},
                {index: 561, type: 'fire'}, {index: 586, type: 'fire'}],
  numStartingGhosts: 5,
  startingGhostPosition: [377,377,377,377,377],
  newGhostInterval: 90,
  newGhostPosition: 377,
  startIndex: 390
}

const Map6 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,0,0,1,1,0,0,1,2,1,0,1,2,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,3,0,1,1,3,0,1,2,1,0,1,2,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,2,1,0,1,2,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,2,2,2,2,2,1,0,1,2,2,2,2,2,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,1,1,1,2,1,3,0,0,1,1,1,5,
    5,1,1,1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,1,1,1,5,
    5,1,1,0,0,1,1,2,1,1,1,1,1,0,1,1,1,1,1,2,1,0,0,0,1,1,1,5,
    5,1,1,0,1,1,1,2,2,2,2,2,1,0,1,2,2,2,2,2,1,0,0,0,1,1,1,5,
    5,1,1,0,1,1,1,1,1,1,1,2,1,0,1,2,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,0,0,0,1,1,1,1,2,1,0,1,2,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,3,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,5,
    5,1,1,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,0,0,0,0,0,3,0,0,0,0,0,1,1,5,
    5,1,1,0,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,5,
    5,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 145, type: 'portal'},{index:209,type:"portal"},
                {index: 164, type: 'drill'},{index:357, type:'portal'},{index:663, type:'drill'}, {index:563, type:'drill'},
                {index:256, type:'drill'}, {index:260, type:'drill'}],
  numStartingGhosts: 7,
  startingGhostPosition: [163,228,395,706,607,232,377],
  newGhostInterval: undefined,
  startIndex: 144
}

const Map7 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,3,3,3,3,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,2,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,1,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 125, type: 'wall'},  {index: 126, type: 'drill'},
                {index: 127, type: 'wall'}, {index: 128, type: 'portal'}, {index: 378, type: 'fire'},  {index: 406, type: 'drill'}],
  numStartingGhosts: 5,
  startingGhostPosition: [714,714,714,714,178],
  newGhostInterval: 50,
  newGhostPosition: 714,
  startIndex: 182
}


const Map8 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,2,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,3,1,1,5,
    5,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,5,
    5,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,5,
    5,1,1,3,0,0,0,3,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,5,
    5,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,5,
    5,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,5,
    5,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,3,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,5,
    5,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,5,
    5,1,1,0,0,3,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,5,
    5,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,5,
    5,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,5,
    5,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 147, type: 'drill'},{index:143,type: 'portal'},
                {index: 80, type: 'portal'}, {index: 248, type: 'drill'}, 
                {index: 359, type: 'drill'},  {index: 621, type: 'drill'}],
  numStartingGhosts: 3,
  startingGhostPosition: [229,246,705],
  newGhostInterval: undefined,
  startIndex: 61
}


const Map9 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,3,3,3,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,0,0,0,0,2,0,0,0,0,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,
    5,1,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 125, type: 'drill'},
                {index: 126, type: 'wall'}, {index: 127, type: 'portal'}, 
                {index: 378, type: 'fire'},  {index: 406, type: 'drill'},{index:434,type:'wall'}],
  numStartingGhosts: 5,
  startingGhostPosition: [714,714,714,714,178],
  newGhostInterval: 50,
  newGhostPosition: 714,
  startIndex: 182
}




const Map10 = {
     layout: [
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,1,0,0,0,2,0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,0,1,1,0,1,5,
    5,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,5,
    5,1,0,1,1,0,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,5,
    5,1,0,0,0,0,1,1,0,1,1,1,1,0,3,0,1,1,1,1,0,1,0,0,0,0,1,5,
    5,1,0,1,1,0,1,1,0,1,1,1,1,0,0,0,1,1,1,1,0,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,0,0,0,0,0,0,3,0,0,0,0,0,0,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,1,5,
    5,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,5,
    5,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,5,
    5,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,5,
    5,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,1,5,
    5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5
  ],
  mapPowerUps: [{index: 63, type: 'portal'},{index:64,type: 'portal'},{index: 717, type: 'drill'},
                {index: 209, type: 'drill'},{index: 350, type: 'drill'},{index: 462, type: 'drill'}],
  numStartingGhosts: 14,
  startingGhostPosition: [201,397,358,442,246,679,695,58,394,165,473,550,456,272],
  newGhostInterval: undefined,
  startIndex:61
}


const maps = [Map1,Map2,Map3, Map4, Map5, Map6, Map7, Map8, Map9,Map10] 

//start the game 
createBoard() 
document.addEventListener('keydown', controller);
document.addEventListener('keyup', e => { if(e.keyCode >= 37 && e.keyCode <= 40){moveKeysCurrentlyPressed[e.keyCode-37] = false}})

//console.log(JSON.parse('./map1.json'))

//to 14 last day - finished, 10 maps and up on github/netlify