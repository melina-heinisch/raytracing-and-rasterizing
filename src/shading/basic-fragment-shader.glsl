precision mediump float;

//Varying that is named exactly as the one in the vertex shader
//That way we can hand over colors from the vertex shader, same name equals same variable
varying vec3 v_color;

void main(void) {
  //Assign the varying to the fragment color, this way when we update varying in the vertex shader it is also saved here
  gl_FragColor = vec4(v_color, 1.0);
}
