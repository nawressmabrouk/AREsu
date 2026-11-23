import { Component, computed, input } from '@angular/core';

/** Loading placeholder: shimmering lines ('text'), table rows ('rows') or cards ('cards'). */
@Component({
  selector: 'app-skeleton',
  host: { 'aria-busy': 'true', role: 'status' },
  template: `
    <span class="sr-only">Chargement…</span>
    @switch (variant()) {
      @case ('cards') {
        <div class="cards">
          @for (i of items(); track i) {
            <div class="card"><div class="bone block"></div><div class="bone line w70"></div><div class="bone line w40"></div></div>
          }
        </div>
      }
      @case ('rows') {
        <div class="rows">
          @for (i of items(); track i) {
            <div class="row"><div class="bone circle"></div><div class="bone line w30"></div><div class="bone line w20"></div><div class="bone line w15"></div></div>
          }
        </div>
      }
      @default {
        @for (i of items(); track i) { <div class="bone line" [class.w60]="$last"></div> }
      }
    }
  `,
  styles: `
    :host { display: block; }
    .bone {
      border-radius: 6px;
      background: linear-gradient(90deg, var(--color-neutral-soft) 25%, var(--color-surface-hover) 50%, var(--color-neutral-soft) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.3s ease-in-out infinite;
    }
    .line { height: 12px; margin: 10px 0; }
    .block { height: 120px; border-radius: var(--radius-md); }
    .circle { width: 32px; height: 32px; border-radius: 50%; flex: none; }
    .w70 { width: 70%; } .w60 { width: 60%; } .w40 { width: 40%; } .w30 { width: 30%; } .w20 { width: 20%; } .w15 { width: 15%; }
    .rows { display: flex; flex-direction: column; }
    .row { display: flex; align-items: center; gap: var(--space-4); padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
    .row .line { margin: 0; }
    .cards { display: grid; gap: var(--space-4); grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); }
    .card { padding: var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  `,
})
export class SkeletonComponent {
  readonly variant = input<'text' | 'rows' | 'cards'>('text');
  readonly count = input(3);
  readonly items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
