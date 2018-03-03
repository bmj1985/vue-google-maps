import omit from 'lodash/omit'
import clone from 'lodash/clone'

import bindEvents from '../utils/bindEvents.js'
import {bindProps, getPropsValues} from '../utils/bindProps.js'
import MapElementMixin from './mapElementMixin'

const props = {
  draggable: {
    type: Boolean
  },
  editable: {
    type: Boolean,
  },
  options: {
    type: Object
  },
  path: {
    type: Array,
    twoWay: true
  },
  paths: {
    type: Array,
    twoWay: true
  },
  deepWatch: {
    type: Boolean,
    default: false
  }
}

const events = [
  'click',
  'dblclick',
  'drag',
  'dragend',
  'dragstart',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'rightclick'
]

export default {
  mixins: [MapElementMixin],
  props: props,

  render () { return '' },

  destroyed () {
    if (this.$polygonObject) {
      this.$polygonObject.setMap(null)
    }
  },

  created () {
    this.$mapPromise.then((map) => {
      const options = clone(getPropsValues(this))
      delete options.options
      Object.assign(options, this.options)
      if (!options.path) {
        delete options.path
      }
      if (!options.paths) {
        delete options.paths
      }
      this.$polygonObject = new google.maps.Polygon(options)

      bindProps(this, this.$polygonObject, omit(props, ['path', 'paths', 'deepWatch']))
      bindEvents(this, this.$polygonObject, events)

      var clearEvents = () => {}

      // Watch paths, on our own, because we do not want to set either when it is
      // empty
      this.$watch('paths', (paths) => {
        if (paths) {
          clearEvents()

          this.$polygonObject.setPaths(paths)

          const updatePaths = () => {
            this.$emit('paths_changed', this.$polygonObject.getPaths())
          }
          const eventListeners = []

          const mvcArray = this.$polygonObject.getPaths()
          for (let i = 0; i < mvcArray.getLength(); i++) {
            let mvcPath = mvcArray.getAt(i)
            eventListeners.push([mvcPath, mvcPath.addListener('insert_at', updatePaths)])
            eventListeners.push([mvcPath, mvcPath.addListener('remove_at', updatePaths)])
            eventListeners.push([mvcPath, mvcPath.addListener('set_at', updatePaths)])
          }
          eventListeners.push([mvcArray, mvcArray.addListener('insert_at', updatePaths)])
          eventListeners.push([mvcArray, mvcArray.addListener('remove_at', updatePaths)])
          eventListeners.push([mvcArray, mvcArray.addListener('set_at', updatePaths)])

          clearEvents = () => {
            eventListeners.map(([obj, listenerHandle]) => // eslint-disable-line no-unused-vars
              google.maps.event.removeListener(listenerHandle))
          }
        }
      }, {
        deep: this.deepWatch,
        immediate: true,
      })

      this.$watch('path', (path) => {
        if (path) {
          clearEvents()

          this.$polygonObject.setPaths(path)

          const mvcPath = this.$polygonObject.getPath()
          const eventListeners = []

          const updatePaths = () => {
            this.$emit('path_changed', this.$polygonObject.getPath())
          }

          eventListeners.push([mvcPath, mvcPath.addListener('insert_at', updatePaths)])
          eventListeners.push([mvcPath, mvcPath.addListener('remove_at', updatePaths)])
          eventListeners.push([mvcPath, mvcPath.addListener('set_at', updatePaths)])

          clearEvents = () => {
            eventListeners.map(([obj, listenerHandle]) => // eslint-disable-line no-unused-vars
              google.maps.event.removeListener(listenerHandle))
          }
        }
      }, {
        deep: this.deepWatch,
        immediate: true,
      })

      // Display the map
      this.$polygonObject.setMap(map)
    })
  },

  events, // FOR DOCUMENTATION PURPOSES
}
