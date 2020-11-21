# NiiVue

**WARNING: THIS IA A WORK IN PROGRESS**

- [Overview]()
- [Development Environment]()
- [Usage]()

# Overview

NiiVue is a minimalists webgl [nifti]() image viewer (for now). 

The goal is go have a simple viewer component that can be embedded in an existing web page.

The viewer component accepts a volume and a shader as properties (inputs).

# TODO

- update webgl-util to export functions
- test nifti reading
- add in nifti to texture conversion
- render nifti slices in webgl canvas

# References

https://github.com/Twinklebear/webgl-util

## Development Environment
```
git clone git@github.com:hanayik/niivue.git # or https
cd niivue

npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
