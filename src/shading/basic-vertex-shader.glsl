//Position of the current vertex, changes with every vertex so its an attribute
attribute vec3 a_position;
//Attribute that is being used to save the current color read from the color buffer
attribute vec3 a_color;
//Transformation Matrix that I change for every object, so its defined as uniform
//Can be accessed by fragment shader as well
uniform mat4 M;

//Varying that is named exactly as the one in the fragment shader
//That way we can hand over colors to the fragment shader, same name equals same variable
varying vec3 v_color;

void main() {
  gl_Position = M*vec4(a_position, 1.0);
  //Assign the color attribute to our varying, so that the value is also present in the varying of the fragment shader
  v_color = a_color;

}
