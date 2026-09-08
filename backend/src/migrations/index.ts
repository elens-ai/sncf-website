import * as migration_20260907_185841_initial from './20260907_185841_initial';

export const migrations = [
  {
    up: migration_20260907_185841_initial.up,
    down: migration_20260907_185841_initial.down,
    name: '20260907_185841_initial'
  },
];
