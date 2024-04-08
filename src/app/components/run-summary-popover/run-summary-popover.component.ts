import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-run-summary-popover',
  templateUrl: './run-summary-popover.component.html',
  styleUrls: ['./run-summary-popover.component.scss'],
})
export class RunSummaryPopoverComponent  implements OnInit {

  @Input() distance?: string;
  @Input() pace?: string;
  @Input() time?: string;

  constructor() { }

  ngOnInit() {}

}
