precision highp float;

// Processing specific input
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// Layer between Processing and Shadertoy uniforms
vec3 iResolution = vec3(resolution,0.0);
float iGlobalTime = time;
vec2 iMouse = vec2(mouse.xy);

#define PI              3.1415926535
#define time            iGlobalTime
#define TOTAL   		4

// Custom
uniform float posX[TOTAL];
uniform float posY[TOTAL];
uniform float R[TOTAL];
uniform float G[TOTAL];
uniform float B[TOTAL];
uniform float intensity;
uniform float contour;

void main()
{
	vec2 fragCoord = gl_FragCoord.xy;
	vec2 ratio = vec2(iResolution.x/iResolution.y, 1.0) / iResolution.xy;

	vec2 uv = fragCoord.xy * ratio;
	uv = vec2(0.0, 1.0) + uv * vec2(1.0, -1.0);//flip uv
	uv -= vec2(0.625, 0.25);
	//vec2 mouse = iMouse * ratio;

	vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
	for (int i = 0; i < TOTAL; i++) {
		float dist = pow(distance(uv, vec2(posX[i]*2.0, posY[i]*2.0) * ratio) * intensity, contour);
		col.rgb += vec3(R[i], G[i], B[i]) / dist;
		col.w += 1.0 / dist;
	}

	//metaball threshold
	if(col.w > pow(20., contour)){
		col.rgb /= col.w;
		gl_FragColor = vec4(col.rgb, 1.0);
	}else{
		gl_FragColor = vec4(vec3(1.0), 0.0);
	}
}