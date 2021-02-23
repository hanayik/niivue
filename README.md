# NiiVue

**WARNING: THIS IS A WORK IN PROGRESS**

- [Overview]()
- [Development Environment]()
- [Usage]()

# Overview

NiiVue is a minimalist webgl [nifti]() image viewer (for now). 

The goal is to have a simple viewer component that can be embedded in an existing web page. There are basic overlay settings such as brightness and opacity controls as well. 

The documentation is incomplete, but will live in this repo once created.

# Example result

![example image](example.png)

# TODO

- allow mouse based slice scrolling
- allow overlays

# References

- https://github.com/rordenlab/MRIcroWeb

# Contributors

- Taylor Hanayik
- Chris Rorden

## Development Environment

### Development Installation

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

## Core data loading concepts

`niivue.js` functions should be designed to accept an `overlayList` (Array) such as:

```
overlayList: [
    {
      volumeURL: "./mni152.nii.gz",
      volume: {hdr: null, img: null},
      name: "mni152.nii.gz",
      intensityMin: 0,
      intensityMax: 100,
      intensityRange:[0, 100],
      colorMap: "gray", // gray
      opacity: 100,
    },
    {
      volumeURL: "./chris_T1.nii.gz",
      volume: {hdr: null, img: null},
      name: "chris_T1.nii.gz",
      intensityMin: 0,
      intensityMax: 100,
      intensityRange:[0, 100],
      colorMap: "gray", // gray
      opacity: 100,
    }
]

```

This `overlayList` informs niivue WebGL calls about most rendering related settings. For now, only the first item in the array is rendered until overlays (layering) is actually supported. 



