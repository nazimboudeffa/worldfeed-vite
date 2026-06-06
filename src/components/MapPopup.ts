import type { ConflictZone, Hotspot, Earthquake, NewsItem } from '@/types';

export type PopupType = 'conflict' | 'hotspot' | 'earthquake';

interface PopupData {
  type: PopupType;
  data: ConflictZone | Hotspot | Earthquake;
  relatedNews?: NewsItem[];
  x: number;
  y: number;
}

export class MapPopup {
  private container: HTMLElement;
  private popup: HTMLElement | null = null;
  private onClose?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public show(data: PopupData): void {
    this.hide();

    this.popup = document.createElement('div');
    this.popup.className = 'map-popup';

    const content = this.renderContent(data);
    this.popup.innerHTML = content;

    const maxPopupHeight = Math.max(260, this.container.clientHeight - 20);
    this.popup.style.maxHeight = `${maxPopupHeight}px`;

    // Append first to measure real size, then clamp position inside container.
    this.container.appendChild(this.popup);

    const body = this.popup.querySelector('.popup-body') as HTMLElement | null;
    const header = this.popup.querySelector('.popup-header') as HTMLElement | null;
    if (body && header) {
      const popupStyle = getComputedStyle(this.popup);
      const borderTop = Number.parseFloat(popupStyle.borderTopWidth || '0') || 0;
      const borderBottom = Number.parseFloat(popupStyle.borderBottomWidth || '0') || 0;
      const availableBodyHeight = Math.max(140, maxPopupHeight - header.offsetHeight - borderTop - borderBottom);
      const bodyHeightCap = 300;
      body.style.maxHeight = `${Math.min(bodyHeightCap, availableBodyHeight)}px`;
    }

    const margin = 10;
    const popupWidth = this.popup.offsetWidth;
    const popupHeight = this.popup.offsetHeight;
    const maxX = this.container.clientWidth - popupWidth - margin;
    const maxY = this.container.clientHeight - popupHeight - margin;
    const left = Math.max(margin, Math.min(data.x + 20, maxX));
    const top = Math.max(margin, Math.min(data.y - 20, maxY));

    this.popup.style.left = `${left}px`;
    this.popup.style.top = `${top}px`;

    // Close button handler
    this.popup.querySelector('.popup-close')?.addEventListener('click', () => this.hide());

    // Click outside to close
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 100);
  }

  private handleOutsideClick = (e: MouseEvent) => {
    if (this.popup && !this.popup.contains(e.target as Node)) {
      this.hide();
    }
  };

  public hide(): void {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
      document.removeEventListener('click', this.handleOutsideClick);
      this.onClose?.();
    }
  }

  public setOnClose(callback: () => void): void {
    this.onClose = callback;
  }

  private renderContent(data: PopupData): string {
    switch (data.type) {
      case 'conflict':
        return this.renderConflictPopup(data.data as ConflictZone);
      case 'hotspot':
        return this.renderHotspotPopup(data.data as Hotspot, data.relatedNews);
      case 'earthquake':
        return this.renderEarthquakePopup(data.data as Earthquake);
      default:
        return '';
    }
  }

  private renderConflictPopup(conflict: ConflictZone): string {
    const severityClass = conflict.intensity === 'high' ? 'high' : conflict.intensity === 'medium' ? 'medium' : 'low';
    const severityLabel = conflict.intensity?.toUpperCase() || 'UNKNOWN';

    return `
      <div class="popup-header popup-kind-conflict">
        <span class="popup-title popup-title-kind">CONFLICT</span>
        <div class="popup-actions">
          <span class="popup-badge ${severityClass}">${severityLabel}</span>
          <button class="popup-close" type="button" title="Close popup" aria-label="Close popup">×</button>
        </div>
      </div>
      <div class="popup-body">
        <p class="popup-location popup-topic-title">${conflict.name.toUpperCase()}</p>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">START DATE</span>
            <span class="stat-value">${conflict.startDate || 'Unknown'}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">CASUALTIES</span>
            <span class="stat-value">${conflict.casualties || 'Unknown'}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">DISPLACED</span>
            <span class="stat-value">${conflict.displaced || 'Unknown'}</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">LOCATION</span>
            <span class="stat-value">${conflict.location || `${conflict.center[1]}°N, ${conflict.center[0]}°E`}</span>
          </div>
        </div>
        ${conflict.description ? `<p class="popup-description">${conflict.description}</p>` : ''}
        ${conflict.parties && conflict.parties.length > 0 ? `
          <div class="popup-section">
            <span class="section-label">BELLIGERENTS</span>
            <div class="popup-tags">
              ${conflict.parties.map(p => `<span class="popup-tag">${p}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        ${conflict.keyDevelopments && conflict.keyDevelopments.length > 0 ? `
          <div class="popup-section">
            <span class="section-label">KEY DEVELOPMENTS</span>
            <ul class="popup-list">
              ${conflict.keyDevelopments.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderHotspotPopup(hotspot: Hotspot, relatedNews?: NewsItem[]): string {
    const severityClass = hotspot.level || 'low';
    const severityLabel = (hotspot.level || 'low').toUpperCase();

    return `
      <div class="popup-header popup-kind-hotspot">
        <span class="popup-title popup-title-kind">HOTSPOT</span>
        <div class="popup-actions">
          <span class="popup-badge ${severityClass}">${severityLabel}</span>
          <button class="popup-close" type="button" title="Close popup" aria-label="Close popup">×</button>
        </div>
      </div>
      <div class="popup-body">
        <p class="popup-location popup-topic-title">${hotspot.name.toUpperCase()}</p>
        ${hotspot.subtext ? `<div class="popup-subtitle">${hotspot.subtext}</div>` : ''}
        ${hotspot.description ? `<p class="popup-description">${hotspot.description}</p>` : ''}
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">COORDINATES</span>
            <span class="stat-value">${hotspot.lat.toFixed(2)}°N, ${hotspot.lon.toFixed(2)}°E</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">STATUS</span>
            <span class="stat-value">${hotspot.status || 'Monitoring'}</span>
          </div>
        </div>
        ${hotspot.agencies && hotspot.agencies.length > 0 ? `
          <div class="popup-section">
            <span class="section-label">KEY ENTITIES</span>
            <div class="popup-tags">
              ${hotspot.agencies.map(a => `<span class="popup-tag">${a}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        ${relatedNews && relatedNews.length > 0 ? `
          <div class="popup-section">
            <span class="section-label">RELATED HEADLINES</span>
            <div class="popup-news">
              ${relatedNews.slice(0, 5).map(n => `
                <div class="popup-news-item">
                  <span class="news-source">${n.source}</span>
                  <a href="${n.link}" target="_blank" class="news-title">${n.title}</a>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderEarthquakePopup(earthquake: Earthquake): string {
    const severity = earthquake.magnitude >= 6 ? 'high' : earthquake.magnitude >= 5 ? 'medium' : 'low';
    const severityLabel = earthquake.magnitude >= 6 ? 'MAJOR' : earthquake.magnitude >= 5 ? 'MODERATE' : 'MINOR';

    const timeAgo = this.getTimeAgo(earthquake.time);

    return `
      <div class="popup-header popup-kind-seismic">
        <span class="popup-title magnitude">M${earthquake.magnitude.toFixed(1)}</span>
        <div class="popup-actions">
          <span class="popup-badge ${severity}">${severityLabel}</span>
          <button class="popup-close" type="button" title="Close popup" aria-label="Close popup">×</button>
        </div>
      </div>
      <div class="popup-body">
        <p class="popup-location">${earthquake.place}</p>
        <div class="popup-stats">
          <div class="popup-stat">
            <span class="stat-label">Depth</span>
            <span class="stat-value">${earthquake.depth.toFixed(1)} km</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">Coordinates</span>
            <span class="stat-value">${earthquake.lat.toFixed(2)}°, ${earthquake.lon.toFixed(2)}°</span>
          </div>
          <div class="popup-stat">
            <span class="stat-label">Time</span>
            <span class="stat-value">${timeAgo}</span>
          </div>
        </div>
        <a href="${earthquake.url}" target="_blank" class="popup-link">View on USGS →</a>
      </div>
    `;
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
