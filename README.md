# NiiVue

**WARNING: THIS IS A WORK IN PROGRESS**

- [Overview]()
- [Development Environment]()
- [Usage]()

# Overview

NiiVue is a minimalist webgl [nifti]() image viewer (for now). 

The goal is go have a simple viewer component that can be embedded in an existing web page.

The viewer component accepts a volume URL as a property (i.e. a reactive input).

# Example result

![example image](example.png)

# TODO

- make viewer resizable
- allow mouse based slice scrolling
- allow overlays

# References

- https://github.com/Twinklebear/webgl-util
- https://github.com/rordenlab/MRIcroWeb

# Contributors

- Taylor Hanayik
- Chris Rorden

## Development Environment
```
# You must install nodejs on your system FIRST!

# Use https protocol if needed
git clone --recurse-submodules git@github.com:hanayik/niivue.git

# webgl-util is a git submodule so the command above clones that too

cd niivue

npm install
```

### Compiles and hot-reloads for development
```
# nifti files are stored in /public
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
