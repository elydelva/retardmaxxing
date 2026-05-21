import type { Seeder } from "./types";

export class SeederRegistry {
  private seeders = new Map<string, Seeder>();

  register(seeder: Seeder): void {
    if (this.seeders.has(seeder.name)) {
      throw new Error(`duplicate seeder: ${seeder.name}`);
    }
    this.seeders.set(seeder.name, seeder);
  }

  registerAll(seeders: Seeder[]): void {
    for (const s of seeders) this.register(s);
  }

  get(name: string): Seeder | undefined {
    return this.seeders.get(name);
  }

  all(): Seeder[] {
    return [...this.seeders.values()];
  }

  /** Topological sort by dependsOn. Throws on cycle or missing dep. */
  ordered(filter?: (s: Seeder) => boolean): Seeder[] {
    const all = filter ? this.all().filter(filter) : this.all();
    const names = new Set(all.map((s) => s.name));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const out: Seeder[] = [];
    const map = new Map(all.map((s) => [s.name, s]));

    const visit = (s: Seeder) => {
      if (visited.has(s.name)) return;
      if (visiting.has(s.name)) throw new Error(`cycle through ${s.name}`);
      visiting.add(s.name);
      for (const dep of s.dependsOn ?? []) {
        if (!names.has(dep)) continue;
        const depSeeder = map.get(dep);
        if (depSeeder) visit(depSeeder);
      }
      visiting.delete(s.name);
      visited.add(s.name);
      out.push(s);
    };

    for (const s of all) visit(s);
    return out;
  }
}
