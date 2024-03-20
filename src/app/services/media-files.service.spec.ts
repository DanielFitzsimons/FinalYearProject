import { TestBed } from '@angular/core/testing';

import { MediaFilesService } from './media-files.service';

describe('MediaFilesService', () => {
  let service: MediaFilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaFilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
