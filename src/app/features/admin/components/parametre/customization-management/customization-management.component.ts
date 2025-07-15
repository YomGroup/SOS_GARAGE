import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customization-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './customization-management.component.html',
  styleUrls: ['./customization-management.component.css']
})
export class CustomizationManagementComponent {
  // Thèmes
  themes = [
    {
      id: 'default',
      name: 'Thème par défaut',
      description: 'Thème classique avec couleurs professionnelles',
      primaryColor: '#004AAD',
      secondaryColor: '#1976d2',
      sidebarColor: '#f8f9fa'
    },
    {
      id: 'dark',
      name: 'Thème sombre',
      description: 'Interface sombre pour un confort visuel optimal',
      primaryColor: '#2c3e50',
      secondaryColor: '#34495e',
      sidebarColor: '#34495e'
    },
    {
      id: 'green',
      name: 'Thème vert',
      description: 'Thème écologique avec des tons verts',
      primaryColor: '#27ae60',
      secondaryColor: '#2ecc71',
      sidebarColor: '#f0f8f0'
    }
  ];

  selectedTheme = 'default';

  // Couleurs personnalisées
  customPrimaryColor = '#004AAD';
  customSecondaryColor = '#1976d2';
  customSidebarColor = '#f8f9fa';

  // Typographie
  selectedFontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  baseFontSize = 14;

  // Disposition
  layouts = [
    {
      id: 'sidebar-left',
      name: 'Barre latérale gauche',
      description: 'Navigation à gauche, contenu à droite',
      sidebarPosition: 'left'
    },
    {
      id: 'sidebar-right',
      name: 'Barre latérale droite',
      description: 'Navigation à droite, contenu à gauche',
      sidebarPosition: 'right'
    },
    {
      id: 'top-nav',
      name: 'Navigation supérieure',
      description: 'Menu en haut, contenu en dessous',
      sidebarPosition: 'top'
    }
  ];

  selectedLayout = 'sidebar-left';

  // Animations
  enableAnimations = true;
  animationSpeed = 'normal';
  enableHoverEffects = true;

  selectTheme(theme: any) {
    this.selectedTheme = theme.id;
    this.customPrimaryColor = theme.primaryColor;
    this.customSecondaryColor = theme.secondaryColor;
    this.customSidebarColor = theme.sidebarColor;
    this.updateCustomColors();
  }

  updateCustomColors() {
    console.log('Couleurs personnalisées mises à jour:', {
      primary: this.customPrimaryColor,
      secondary: this.customSecondaryColor,
      sidebar: this.customSidebarColor
    });
    // Logique pour appliquer les couleurs
  }

  updateTypography() {
    console.log('Typographie mise à jour:', {
      fontFamily: this.selectedFontFamily,
      fontSize: this.baseFontSize
    });
    // Logique pour appliquer la typographie
  }

  selectLayout(layout: any) {
    this.selectedLayout = layout.id;
    console.log('Disposition sélectionnée:', layout.name);
  }

  updateAnimations() {
    console.log('Paramètres d\'animation mis à jour:', {
      enabled: this.enableAnimations,
      speed: this.animationSpeed,
      hoverEffects: this.enableHoverEffects
    });
  }

  saveCustomization() {
    console.log('Personnalisation sauvegardée:', {
      theme: this.selectedTheme,
      colors: {
        primary: this.customPrimaryColor,
        secondary: this.customSecondaryColor,
        sidebar: this.customSidebarColor
      },
      typography: {
        fontFamily: this.selectedFontFamily,
        fontSize: this.baseFontSize
      },
      layout: this.selectedLayout,
      animations: {
        enabled: this.enableAnimations,
        speed: this.animationSpeed,
        hoverEffects: this.enableHoverEffects
      }
    });
  }

  resetCustomization() {
    this.selectedTheme = 'default';
    this.customPrimaryColor = '#004AAD';
    this.customSecondaryColor = '#1976d2';
    this.customSidebarColor = '#f8f9fa';
    this.selectedFontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    this.baseFontSize = 14;
    this.selectedLayout = 'sidebar-left';
    this.enableAnimations = true;
    this.animationSpeed = 'normal';
    this.enableHoverEffects = true;
    
    console.log('Personnalisation réinitialisée');
  }
} 