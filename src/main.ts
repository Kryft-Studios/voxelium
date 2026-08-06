// noa Engine & internal Types
import { Engine } from 'noa-engine'
import { PositionState } from 'noa-engine/dist/src/components/position'
import { PhysicsState } from 'noa-engine/dist/src/components/physics'
import { ChunkStorage } from 'noa-engine/dist/src/lib/util'

// create an engine
let opts = {
    debug: true,
    silent: false,
    showFPS: true,
    chunkSize: 32,
    chunkAddDistance: 2.5,
    chunkRemoveDistance: 3.5, 
    playerStart: [0, 0, 0]
}
let noa = new Engine(opts)


// basic blocks

const brownish = [0.45, 0.36, 0.22]
noa.registry.registerMaterial('dirt', { color: brownish })
const dirtID = noa.registry.registerBlock(1, { material: 'dirt' })


// register for world events
noa.world.on('worldDataNeeded', function (id, data, x, y, z) {
    // TODO: Implement loading with .bloxdschem read
    // `id` - a unique string id for the chunk
    // `data` - an `ndarray` of voxel ID data (see: https://github.com/scijs/ndarray)
    // `x, y, z` - world coords of the corner of the chunk
    /* for (var i = 0; i < data.shape[0]; i++) {
         for (var j = 0; j < data.shape[1]; j++) {
             for (var k = 0; k < data.shape[2]; k++) {
                 var voxelID = getVoxelID(x + i, y + j, z + k)
                 data.set(i, j, k, voxelID)
             }
         }
     }*/

    // the only code for now.
    noa.setBlock(dirtID, 0, 0, 0)
    noa.world.setBlockID(1, 0, 0, 0)
    // tell noa the chunk's terrain data is now set
    noa.world.setChunkData(id, data)
})
function chkIdToChkPos(id:string){
    // noa stores chunk in x|y|z
    return id.split("|").map(Number)
}
const strg = noa.world._storage
noa.world.on("chunkBeingRemoved",(id,array)=>{///
    console.log(array.data)
    console.log(strg.getChunkByIndexes(...chkIdToChkPos(id)))
})
//noa.world.on("chunkAdded",console.log)

// get the player entity's ID and other info (position, size, ..)
const player = noa.playerEntity
let posdat = noa.entities.getPositionData(player) as PositionState
const movement = noa.ents.getMovement(noa.playerEntity)
const phy = noa.ents.getPhysics(player) as PhysicsState;



movement.airJumps = 0
noa.world.on

noa.physics.gravity = [0, 0, 0];
(noa.ents.getPhysicsBody(noa.playerEntity))?.resting


/*
 * 
 *      Minimal interactivity 
 * 
*/

// add a key binding for "E" to do the same as alt-fire
noa.inputs.down.on("jump", function () {
    noa.ents.getPhysics(noa.playerEntity)?.body.applyForce([0, 10, 0])
})
//register key
noa.inputs.state.crouch = false;
//@ts-ignore
noa.inputs._keyBindmap.KeyC = ["crouch"]
// each tick, consume any scroll events and use them to zoom camera
noa.on('tick', function (dt) {
    var scroll = noa.inputs.pointerState.scrolly
    if (scroll !== 0) {
        noa.camera.zoomDistance += (scroll > 0) ? 1 : -1
        if (noa.camera.zoomDistance < 0) noa.camera.zoomDistance = 0
        if (noa.camera.zoomDistance > 10) noa.camera.zoomDistance = 10
    }
    if (noa.inputs.state.jump) {
        noa.ents.getPhysics(noa.playerEntity)?.body.applyImpulse([0, 2, 0])
    }
    if (noa.inputs.state.crouch) {
        noa.ents.getPhysics(noa.playerEntity)?.body.applyImpulse([0, -2, 0])

    }

})

noa.on("tick", () => {
    const move = noa.ents.getMovement(noa.playerEntity)
    const body = noa.ents.getPhysicsBody(noa.playerEntity)

    if (!move.running && body && !noa.inputs.state.crouch && !noa.inputs.state.jump) {
        body.velocity[0] = 0
        body.velocity[2] = 0
        body.velocity[1] = 0
    }
})
