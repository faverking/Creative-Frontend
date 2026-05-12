import { describe, expect, it } from 'vitest'

import {
  normalizeAppBasePath,
  resolveAppRoutePathFromLocation,
  resolveBrowserPathForAppRoute
} from './browser-path'

describe('browser path helpers', () => {
  it('normalizes app base paths', () => {
    expect(normalizeAppBasePath('/')).toBe('/')
    expect(normalizeAppBasePath('admin')).toBe('/admin/')
    expect(normalizeAppBasePath('/admin')).toBe('/admin/')
    expect(normalizeAppBasePath('/admin/')).toBe('/admin/')
  })

  it('resolves internal route paths from a root based location', () => {
    expect(
      resolveAppRoutePathFromLocation(
        {
          pathname: '/articles/1',
          search: '?tab=info',
          hash: '#comments'
        },
        '/'
      )
    ).toBe('/articles/1?tab=info#comments')
  })

  it('strips a nested app base from browser locations', () => {
    expect(resolveAppRoutePathFromLocation({ pathname: '/admin/home/overview' }, '/admin/')).toBe(
      '/home/overview'
    )
    expect(resolveAppRoutePathFromLocation({ pathname: '/admin' }, '/admin/')).toBe('/')
    expect(resolveAppRoutePathFromLocation({ pathname: '/admin/' }, '/admin/')).toBe('/')
  })

  it('resolves browser paths for app routes', () => {
    expect(resolveBrowserPathForAppRoute('/login?redirect=%2Fhome', '/admin/')).toBe(
      '/admin/login?redirect=%2Fhome'
    )
    expect(resolveBrowserPathForAppRoute('/home', '/')).toBe('/home')
    expect(resolveBrowserPathForAppRoute('/', '/admin/')).toBe('/admin/')
  })
})
