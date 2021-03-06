
var Simulator = function(maxIterations, playerPool, collectingData){
playerPool = playerPool || ROBOT.registry;
collectingData = collectingData || false;
var scoreTotal = { games: 0 };
var module = {};

function getSimRobots(numPlayers){
    var robots = shuffle(playerPool);
    var out = [];
    for (var i = 0; i < numPlayers; i++){
        out.push(PLAYER.new(robots[i % robots.length]));
    }
    return out;
}

function printResults(){
    var html = [];
    html.push(scoreTotal.games + " games");
    playerPool.forEach(function (robot){
        var key = robot.name;
        var avg = 0.0;
        scoreTotal[key].forEach(function (score){
            avg += score;
        });
        html.push(formatStr(
            "{1} | {2} | {3}",
            key,
            (avg / scoreTotal[key].length).toFixed(2),
            scoreTotal[key].length
        ));
    });
    $('#sim').html(html.join("<br/>"));
}

function recordResults(players){
    scoreTotal.games += 1;
    players.forEach(function (player){
        scoreTotal[player.id] = (scoreTotal[player.id] || []).concat(player.getTotalScore());
        player.restart();
    });
}

function gameCallbackFactory(gameLock){
    var runs = 100;
    var callback = function(players){
        recordResults(players);
        runs -= 1;
        if (runs > 0){
            GAME.start(module.playerFunc(players.length), callback);
        } else {
            printResults();
            gameLock.resolve();
        }
    }
    return callback;
}

function startCallbackStack(numPlayers){
    var gameLock = new $.Deferred();
    var callback = gameCallbackFactory(gameLock);
    GAME.start(module.playerFunc(numPlayers), callback);
    $.when(gameLock).then(function (){
        if (scoreTotal.games < maxIterations){
            setTimeout(function (){
                startCallbackStack(numPlayers);
            }, 1);
        } else if(collectingData) {
            HISTORY.print();
        }
    });
}

function runSim(numPlayers){
    startCallbackStack(numPlayers);
}

module.playerFunc = getSimRobots;
module.start = runSim;
return module;
};
