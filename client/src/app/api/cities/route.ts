import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Force Node.js runtime (not Edge) so the package works
export const runtime = 'nodejs';

const INDIA_DIR = path.join(
  process.cwd(),
  'node_modules',
  '@countrystatecity',
  'countries',
  'dist',
  'data',
  'India-IN'
);

const STATES_FILE_PATH = path.join(INDIA_DIR, 'states.json');
let cachedStates: Array<{ iso2: string; name: string }> | null = null;
let stateDirMap: Map<string, string> | null = null;

async function loadStates() {
  if (cachedStates) return cachedStates;
  const fileContent = await fs.readFile(STATES_FILE_PATH, 'utf-8');
  const states = JSON.parse(fileContent);

  if (!Array.isArray(states)) {
    throw new Error('Invalid states data format inside package');
  }

  cachedStates = states.map((state) => ({
    iso2: state.iso2,
    name: state.name
  }));

  return cachedStates;
}

async function loadStateDirectoryMap() {
  if (stateDirMap) return stateDirMap;

  const dirEntries = await fs.readdir(INDIA_DIR, { withFileTypes: true });
  stateDirMap = new Map();

  dirEntries.forEach((entry) => {
    if (!entry.isDirectory()) return;
    const parts = entry.name.split('-');
    const iso2 = parts[parts.length - 1];
    if (iso2) {
      stateDirMap?.set(iso2.toUpperCase(), entry.name);
    }
  });

  return stateDirMap;
}

// API route to fetch cities for a state server-side
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCodeParam = searchParams.get('state');

    if (!stateCodeParam) {
      return NextResponse.json(
        { success: false, error: 'State code is required' },
        { status: 400 }
      );
    }

    const stateCode = stateCodeParam.toUpperCase();
    const states = await loadStates();
    const targetState = states.find((state) => state.iso2.toUpperCase() === stateCode);

    if (!targetState) {
      return NextResponse.json(
        { success: false, error: `Invalid state code: ${stateCode}` },
        { status: 404 }
      );
    }

    const directoryMap = await loadStateDirectoryMap();
    const stateDirName = directoryMap.get(stateCode);

    if (!stateDirName) {
      return NextResponse.json(
        { success: false, error: `Directory not found for state code: ${stateCode}` },
        { status: 404 }
      );
    }

    const citiesFilePath = path.join(INDIA_DIR, stateDirName, 'cities.json');
    const citiesContent = await fs.readFile(citiesFilePath, 'utf-8');
    const citiesData = JSON.parse(citiesContent);

    if (!Array.isArray(citiesData)) {
      throw new Error(`Invalid cities data format for state: ${stateCode}`);
    }

    const formattedCities = citiesData.map((city) => ({
      name: city.name
    }));

    return NextResponse.json({
      success: true,
      cities: formattedCities,
      count: formattedCities.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API][Cities] Failed to load cities:', message);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch cities', message },
      { status: 500 }
    );
  }
}

