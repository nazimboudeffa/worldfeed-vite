export interface PanelOptions {
  id: string;
  title: string;
  showCount?: boolean;
  className?: string;
}

export class Panel {
  protected element: HTMLElement;
  protected content: HTMLElement;
  protected header: HTMLElement;
  protected countEl: HTMLElement | null = null;
  private expanded = false;

  constructor(options: PanelOptions) {
    this.element = document.createElement('div');
    this.element.className = `panel ${options.className || ''}`;
    this.element.dataset.panel = options.id;

    this.header = document.createElement('div');
    this.header.className = 'panel-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'panel-header-left';

    const title = document.createElement('span');
    title.className = 'panel-title';
    title.textContent = options.title;
    headerLeft.appendChild(title);

    this.header.appendChild(headerLeft);

    if (options.showCount) {
      this.countEl = document.createElement('span');
      this.countEl.className = 'panel-count';
      this.countEl.textContent = '0';
      this.header.appendChild(this.countEl);
    }

    this.content = document.createElement('div');
    this.content.className = 'panel-content';
    this.content.id = `${options.id}Content`;

    this.header.addEventListener('click', () => this.toggleExpanded());

    this.element.appendChild(this.header);
    this.element.appendChild(this.content);
    this.collapse();

    this.showLoading();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public showLoading(): void {
    this.content.innerHTML = '<div class="loading">Loading</div>';
  }

  public showError(message = 'Failed to load data'): void {
    this.content.innerHTML = `<div class="error-message">${message}</div>`;
  }

  public setCount(count: number): void {
    if (this.countEl) {
      this.countEl.textContent = count.toString();
    }
  }

  public setContent(html: string): void {
    this.content.innerHTML = html;
  }

  public setExpanded(expanded: boolean): void {
    this.expanded = expanded;
    this.element.classList.toggle('expanded', expanded);
    this.element.classList.toggle('collapsed', !expanded);
  }

  public toggleExpanded(): void {
    this.setExpanded(!this.expanded);
  }

  public expand(): void {
    this.setExpanded(true);
  }

  public collapse(): void {
    this.setExpanded(false);
  }

  public show(): void {
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
