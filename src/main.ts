

/* 
 * 
 *          noa hello-world example
 * 
 *  This is a bare-minimum example world, intended to be a 
 *  starting point for hacking on noa game world content.
 * 
*/



// Engine options object, and engine instantiation.
import { Engine } from 'noa-engine'


let opts = {
    debug: true,
    silent:false,
    showFPS: true,
    chunkSize: 32,
    chunkAddDistance: 2.5,
    chunkRemoveDistance: 3.5,playerStart: [0,0,0]
    
    // See `test` example, or noa docs/source, for more options
}
let  noa = new Engine(opts)



/*
 *
 *      Registering voxel types
 * 
 *  Two step process. First you register a material, specifying the 
 *  color/texture/etc. of a given block face, then you register a 
 *  block, which specifies the materials for a given block type.
 * 
*/

// block materials (just colors for this demo)
const brownish = [0.45, 0.36, 0.22]
const greenish = [0.1, 0.8, 0.2]
noa.registry.registerMaterial('dirt', { color: brownish })
noa.registry.registerMaterial('grass', { color: greenish })


// block types and their material names
const dirtID = noa.registry.registerBlock(1, { material: 'dirt' })
const grassID = noa.registry.registerBlock(2, { material: 'grass' })




/*
 * 
 *      World generation
 * 
 *  The world is divided into chunks, and `noa` will emit an 
 *  `worldDataNeeded` event for each chunk of data it needs.
 *  The game client should catch this, and call 
 *  `noa.world.setChunkData` whenever the world data is ready.
 *  (The latter can be done asynchronously.)
 * 
*/

// simple height map worldgen function
function getVoxelID(x: number, y: number, z: number) {
    return 0 // signifying empty space
}

// register for world events
noa.world.on('worldDataNeeded', function (id, data, x, y, z) {
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
   noa.setBlock(1, 0, 0, 0)
noa.world.setBlockID(1,0,0,0)
    // tell noa the chunk's terrain data is now set
    noa.world.setChunkData(id, data)
})



/*
 * 
 *      Create a mesh to represent the player:
 * 
*/

// get the player entity's ID and other info (position, size, ..)
const player = noa.playerEntity
let dat = noa.entities.getPositionData(player) as PositionState
const m = noa.ents.getMovement(noa.playerEntity)
const pla = noa.ents.getPhysics(player) as PhysicsState;
m.airJumps = 0
m.standingFriction = 20
m.runningFriction = 2
let w = dat.width
let h = dat.height

// add a mesh to represent the player, and scale it, etc.
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { PositionState } from 'noa-engine/dist/src/components/position'
import { PhysicsState } from 'noa-engine/dist/src/components/physics'

let scene = noa.rendering.getScene()
/*let mesh = CreateBox('player-mesh', {}, scene)
mesh.scaling.x = w
mesh.scaling.z = w
mesh.scaling.y = h
// this adds a default flat material, without specularity
mesh.material = noa.rendering.makeStandardMaterial("mat")
*/
noa.physics.gravity = [0,0,0];
(noa.ents.getPhysicsBody(noa.playerEntity))?.resting

// add "mesh" component to the player entity
// this causes the mesh to move around in sync with the player entity
//@ts-ignore
/*noa.entities.addComponent(player, noa.entities.names.mesh, {
    mesh: mesh,
    // offset vector is needed because noa positions are always the 
    // bottom-center of the entity, and Babylon's CreateBox gives a 
    // mesh registered at the center of the box
    offset: [0, h / 2, 0],
})*/


/*
 * 
 *      Minimal interactivity 
 * 
*/

// add a key binding for "E" to do the same as alt-fire

// each tick, consume any scroll events and use them to zoom camera
noa.on('tick', function (dt) {
    var scroll = noa.inputs.pointerState.scrolly
    if (scroll !== 0) {
        noa.camera.zoomDistance += (scroll > 0) ? 1 : -1
        if (noa.camera.zoomDistance < 0) noa.camera.zoomDistance = 0
        if (noa.camera.zoomDistance > 10) noa.camera.zoomDistance = 10
    }
})

noa.on("tick", () => {
    const move = noa.ents.getMovement(noa.playerEntity)
    const body = noa.ents.getPhysicsBody(noa.playerEntity) 

    if (!move.running && body) {
        body.velocity[0] = 0
        body.velocity[2] = 0
    }
})
