/*
 *  RECORDER CHANGE DITECTION LOGIC
 */
var id = 0;
var clonedDocument = document.cloneNode(true);
var mainDocument = document;

//generate unique node ids
function genNodeIds(cloned, main){
    var scripts = [];
    var __id = id++;
    
    main['__id'] = __id;
    if(cloned.setAttribute){
        cloned.setAttribute('__id', __id);
    }

    cloned.childNodes.forEach(function(e, i){
        if(e.nodeName == 'SCRIPT'){
            scripts.push(e);
        }else{
            genNodeIds(e, main.childNodes[i]);
        }
    });
    
    //remove scripts
    scripts.forEach(function(e){
        e.parentElement.removeChild(e);
    });
}
genNodeIds(clonedDocument, mainDocument);

//run mutation in section
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation){
        mutation.timestamp = Date.now();
        domChange(mutation);
    });
});

observer.observe($('section')[0], { 
//         attributes: true,
        childList: true, 
        subtree: true
});

function getArrayOfNode(node){
    var arr = [];
    node.forEach(function(e){
        arr.push(e);
    });
    return arr;
}

var recorder = {records: []};

function domChange(muta){
    console.log(muta);
    if(muta.target.__id){
        var data = {};
        data.timestamp = muta.timestamp;
        data.target = muta.target.__id;
        data.type = muta.type;
        data.added = getArrayOfNode(muta.addedNodes).map(function(e){
            
            var clonedE = e.cloneNode(true);
            genNodeIds(clonedE, e);
            return {
                html : clonedE.outerHTML
            }
        });
        data.removed = getArrayOfNode(muta.removedNodes).map(function(e){
            return {
                __id : e.__id
            }
        });
        
        if(muta.nextSibling){
            data.nextSibling = muta.nextSibling.__id;
        }
        if(muta.previousSibling){
            data.previousSibling = muta.previousSibling.__id;
        }
        
//         console.log(data);
        recorder.records.push(data);
    }
    
//     setTimeout(function(){
//         play(recorder.records);
//         recorder = {records: []};
//     }, 1000);

    console.log(recorder);
}


/*
 *  PLAYER LOGIC AND DOM MANUPULATION
 */

//data we require from source
var docStr = $(clonedDocument).children().html();
var fwidth = window.innerWidth;
var fheight = window.innerHeight;
//eof data we require from source

//logic of player
var frame = $('#viewer');
frame.css('width', fwidth);
frame.css('height', fheight);

var framDoc = $(frame[0].contentDocument);
framDoc.children().html(docStr);

function domUpdate(e){
    e.added.forEach(function(ee){
        var nd = $(ee.html);
//         console.log(nd);
        $('[__id='+ e.target +']', frame.contents())
        .before(nd, $('[__id='+ e.previousSibling +']', frame.contents()));
    });

    e.removed.forEach(function(ee){ 
        console.log($('[__id='+ ee.__id +']' , frame.contents()), ee.__id);

        $('[__id='+ ee.__id +']', frame.contents()).remove();
    });
}

function play(records){
    
    var speed = 1;

    var delay = 0;
    records.forEach(function(e, i){
        (function(){
            if(i > 0){
                delay += Math.floor(( e.timestamp - records[i-1].timestamp) * speed);
            }
            setTimeout(function(){
                console.log(e);
                domUpdate(e);
            }, delay);

        })();
    });
}

setTimeout(function(){
    play(recorder.records);
}, 1000);

