import { useEffect } from 'react'
import { Vibrant } from 'vibrant'

export function useColorPalette(imageUrl) {
  useEffect(() => {
    const extractColors = async () => {
      try {
        const palette = await Vibrant.from(imageUrl).getPalette()
        
        // Obtener los colores en formato hex
        const colors = {
          vibrant: palette.Vibrant?.getHex() || '#FF6B6B',
          muted: palette.Muted?.getHex() || '#95A5A6',
          darkVibrant: palette.DarkVibrant?.getHex() || '#C92A2A',
          darkMuted: palette.DarkMuted?.getHex() || '#2C3E50',
          lightVibrant: palette.LightVibrant?.getHex() || '#FFD93D',
          lightMuted: palette.LightMuted?.getHex() || '#ECF0F1'
        }
        
        // Aplicar los colores como variables CSS
        const root = document.documentElement
        root.style.setProperty('--color-vibrant', colors.vibrant)
        root.style.setProperty('--color-muted', colors.muted)
        root.style.setProperty('--color-dark-vibrant', colors.darkVibrant)
        root.style.setProperty('--color-dark-muted', colors.darkMuted)
        root.style.setProperty('--color-light-vibrant', colors.lightVibrant)
        root.style.setProperty('--color-light-muted', colors.lightMuted)
        
        console.log('Paleta de colores cargada:', colors)
      } catch (error) {
        console.error('Error al extraer colores de la imagen:', error)
      }
    }
    
    if (imageUrl) {
      extractColors()
    }
  }, [imageUrl])
}
