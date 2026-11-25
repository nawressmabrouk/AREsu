import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';

/**
 * Moves its element to the end of <body> while it exists.
 *
 * A `position: fixed` overlay is positioned relative to the nearest ancestor
 * that has a transform, filter or backdrop-filter, not the window. Modals
 * declared inside such an ancestor (the top bar's blurred background) would be
 * clipped to it; rendering them under <body> keeps them full-screen.
 */
@Directive({ selector: '[appPortalToBody]' })
export class PortalToBodyDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  ngOnInit(): void {
    this.document.body.appendChild(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.el.nativeElement.remove();
  }
}
