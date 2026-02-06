import { MENU_ITEMS } from '@/assets/data/menu-items'
export const getMenuItems = () => {
  return MENU_ITEMS
}
export const findAllParent = (menuItems, menuItem) => {
  const findPath = (items, targetKey) => {
    if (!items) return null
    for (const item of items) {
      if (item.key === targetKey) {
        return [] // Found the item
      }
      if (item.children) {
        const path = findPath(item.children, targetKey)
        if (path) {
          return [item.key, ...path]
        }
      }
    }
    return null
  }
  
  const path = findPath(menuItems, menuItem.key)
  return path || []
}
export const getMenuItemFromURL = (items, url) => {
  if (!items) return null

  // Helper to find exact match
  const findExact = (itemList, targetUrl) => {
    if (Array.isArray(itemList)) {
      for (const item of itemList) {
        if (item.url === targetUrl) return item
        if (item.children) {
          const found = findExact(item.children, targetUrl)
          if (found) return found
        }
      }
    } else {
      if (itemList.url === targetUrl) return itemList
      if (itemList.children) {
        return findExact(itemList.children, targetUrl)
      }
    }
    return null
  }

  // Helper to find prefix match (closest parent route)
  // We want the longest matching URL
  const findPrefix = (itemList, targetUrl) => {
    let bestMatch = null
    
    const visit = (item) => {
      // Check if this item's URL is a prefix of targetUrl
      if (item.url && targetUrl.startsWith(item.url)) {
        // If we found a longer match, replace it
        if (!bestMatch || item.url.length > bestMatch.url.length) {
          bestMatch = item
        }
      }
      
      if (item.children) {
        item.children.forEach(visit)
      }
    }

    if (Array.isArray(itemList)) {
      itemList.forEach(visit)
    } else {
      visit(itemList)
    }
    
    return bestMatch
  }

  // 1. Try exact match
  const exact = findExact(items, url)
  if (exact) return exact

  // 2. Try prefix match
  return findPrefix(items, url)
}
export const findMenuItem = (menuItems, menuItemKey) => {
  if (menuItems && menuItemKey) {
    for (const item of menuItems) {
      if (item.key === menuItemKey) {
        return item
      }
      const found = findMenuItem(item.children, menuItemKey)
      if (found) return found
    }
  }
  return null
}
