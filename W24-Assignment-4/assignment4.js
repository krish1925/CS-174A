import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs

export class Assignment4 extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
        //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
        //        a cube instance's texture_coords after it is already created.
        this.shapes = {
            box_1: new Cube(),
            box_2: new Cube(),
            axis: new Axis_Arrows()
        }
        console.log(this.shapes.box_1.arrays.texture_coord)

        this.shapes.box_2.arrays.texture_coord = this.shapes.box_2.arrays.texture_coord.map(x => x.times(2));
        // TODO:  Create the materials required to texture both cubes with the correct images and settings.
        //        Make each Material from the correct shader.  Phong_Shader will work initially, but when
        //        you get to requirements 6 and 7 you will need different ones.
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: 0.5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png")
            }),
            stars: new Material(new Texture_Rotate(), {
                color: hex_color("#000000"),
                ambient: 1, 
                texture: new Texture("assets/stars.png", "NEAREST")
            }),
            earth: new Material(new Texture_Scroll_X(), {
                color: hex_color("#000000"),
                ambient: 1, 
                texture: new Texture("assets/earth.gif", "LINEAR_MIPMAP_LINEAR")
            }),
        }
        this.state = false;
        this.cube1_transform = Mat4.identity().times(Mat4.translation(-2, 0, 0));
        this.cube2_transform = Mat4.identity().times(Mat4.translation(2, 0, 0));

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
        this.key_triggered_button("Start/Stop Texture Animation", ["c"], () => {
            this.state = !this.state;
        });

    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -8));
        }


        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        let model_transform = Mat4.identity();

        if (this.state) {
            let cube1_rotation = Math.PI/3 * dt;
            this.cube1_transform = this.cube1_transform.times(Mat4.rotation(cube1_rotation, 1, 0, 0));
            let cube2_rotation = Math.PI/2 * dt;
            this.cube2_transform = this.cube2_transform.times(Mat4.rotation(cube2_rotation, 0, 1, 0));
        }

        // TODO:  Draw the required boxes. Also update their stored matrices.
        // You can remove the folloeing line.
        this.shapes.box_1.draw(context, program_state, this.cube1_transform, this.materials.stars);
        this.shapes.box_2.draw(context, program_state, this.cube2_transform, this.materials.earth);
    }
}






class Texture_Scroll_X extends Textured_Phong {
    // Modify the shader below for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                float slide_trans = mod(animation_time, 4.) * 2.; 
                mat4 slide_matrix = mat4(vec4(-1, 0, 0, 0), vec4( 0, 1, 0, 0),  vec4(0, 0, 1, 0), vec4(slide_trans, 0, 0, 1)); 
                vec4 new_coord = vec4(f_tex_coord, 0, 0) + vec4(1, 1, 0, 1); 
                new_coord = slide_matrix * new_coord; 
                vec4 texture_color = texture2D(texture, new_coord.xy);
                 float x = mod(new_coord.x, 1.0);
                 float y = mod(new_coord.y, 1.0);
                 //float border1= 1-0.15;
                 if (x > 0.15 && x < 0.25 && y > 0.15 && y < 0.85) {
                     texture_color = vec4(0, 0, 0, 1);
                 }
                 if (x> 0.75 && x < 0.85 && y > 0.15 && y< 0.85) {
                     texture_color = vec4(0, 0, 0, 1);
                 }
                 if (y>0.15 && y<0.25 && x > 0.15 && x < 0.85) {
                     texture_color = vec4(0, 0, 0, 1);
                 }
                 if (y > 0.75 && y < 0.85 && x > 0.15 && x < 0.85) {
                     texture_color = vec4(0, 0, 0, 1);
                 }
                if( texture_color.w<.01) 
                    discard;
                gl_FragColor = vec4( (texture_color.xyz + shape_color.xyz)*ambient, shape_color.w*texture_color.w ); 
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}



class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                // Sample the texture image in the correct place:
                float theta = 0.5 * 3.14159265358979323846264338327950288419716939937510 * mod(animation_time, 4.); 
                mat4 rotation_matrix = mat4(vec4(cos(theta), sin(theta),0, 0), vec4(sin(theta), -cos(theta), 0, 0), vec4( 0,0,1,0), vec4(0,0,0,1));
                vec4 new_coord = vec4(f_tex_coord, 0, 0) + vec4(-.5, -.5, 0., 0.);
                new_coord = (rotation_matrix * new_coord) + vec4(.5, .5, 0., 0.); 
                vec4 texture_color = texture2D(texture, new_coord.xy);
                float x = mod(new_coord.x, 1.0);
                float y = mod(new_coord.y, 1.0);
                if (x> 0.15 && x < 0.25 && y > 0.15 && y < 0.85) {
                     texture_color = vec4(0, 0, 0, 1);
                 }
                if (x> 0.75 && x< 0.85 && y > 0.15 && y < 0.85) {
                     texture_color = vec4(0, 0, 0, 1);
                 }
                if (y > 0.15 && y < 0.25 && x>0.15 && x<0.85) {
                     texture_color = vec4(0, 0, 0, 1);
                 }
                if (y > 0.75 && y < 0.85 && x>0.15 && x<0.85) {
                     texture_color = vec4(0, 0, 0, 1);
                 }
                if( texture_color.w < .01 ) discard;
                gl_FragColor = vec4( ( texture_color.xyz + shape_color.xyz ) *ambient, shape_color.w * texture_color.w ); 
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}



