<template>
  <div class="world-map-container">
    <div v-if="loading" class="loading-container">
      <div class="animate-pulse">
        <div class="bg-gray-200 h-64 rounded-lg" />
      </div>
    </div>

    <div v-else-if="error" class="error-container">
      <lf-icon name="exclamation-triangle" class="text-red-500 mr-2" />
      <span class="text-red-600">{{ error }}</span>
    </div>

    <div v-else class="world-map-wrapper">
      <!-- Map Legend -->
      <div class="map-legend">
        <div class="legend-item">
          <div class="legend-color member-color" />
          <span class="legend-text">Members ({{ locationData?.totals?.members || 0 }})</span>
        </div>
        <div v-if="type === 'both'" class="legend-item">
          <div class="legend-color org-color" />
          <span class="legend-text">Organizations ({{ locationData?.totals?.organizations || 0 }})</span>
        </div>
      </div>

      <!-- World Map SVG -->
      <div class="map-svg-container">
        <svg
          ref="mapSvg"
          viewBox="0 0 1000 500"
          class="world-map-svg"
          @mouseleave="hideTooltip"
        >
          <!-- World Map Background (Simplified) -->
          <g class="countries">
            <!-- Major Countries (simplified paths) -->
            <!-- United States -->
            <path
              d="M200,200 L300,180 L350,220 L320,280 L250,300 L180,250 Z"
              class="country-path"
              data-country="US"
              @mouseenter="showCountryTooltip($event, 'US')"
              @click="selectCountry('US')"
            />
            <!-- Europe (simplified) -->
            <path
              d="M450,150 L550,140 L580,180 L550,220 L480,210 L450,180 Z"
              class="country-path"
              data-country="EU"
              @mouseenter="showCountryTooltip($event, 'EU')"
              @click="selectCountry('EU')"
            />
            <!-- Asia (simplified) -->
            <path
              d="M650,120 L800,100 L850,150 L820,200 L700,220 L650,180 Z"
              class="country-path"
              data-country="AS"
              @mouseenter="showCountryTooltip($event, 'AS')"
              @click="selectCountry('AS')"
            />
            <!-- Additional simplified continent shapes can be added here -->
          </g>

          <!-- Data Points -->
          <g class="data-points">
            <!-- Member Data Points -->
            <g v-if="type === 'members' || type === 'both'" class="member-points">
              <circle
                v-for="member in locationData?.members || []"
                :key="`member-${member.countryCode}`"
                :cx="getCountryX(member.countryCode)"
                :cy="getCountryY(member.countryCode)"
                :r="getPointRadius(member.count, 'members')"
                class="member-point"
                @mouseenter="showDataTooltip($event, member, 'member')"
                @mouseleave="hideTooltip"
                @click="selectLocation(member, 'member')"
              />
            </g>

            <!-- Organization Data Points -->
            <g v-if="type === 'organizations' || type === 'both'" class="org-points">
              <circle
                v-for="org in locationData?.organizations || []"
                :key="`org-${org.countryCode}`"
                :cx="getCountryX(org.countryCode) + (type === 'both' ? 10 : 0)"
                :cy="getCountryY(org.countryCode) + (type === 'both' ? 10 : 0)"
                :r="getPointRadius(org.count, 'organizations')"
                class="org-point"
                @mouseenter="showDataTooltip($event, org, 'organization')"
                @mouseleave="hideTooltip"
                @click="selectLocation(org, 'organization')"
              />
            </g>
          </g>
        </svg>

        <!-- Tooltip -->
        <div
          v-if="tooltip.visible"
          ref="tooltip"
          class="map-tooltip"
          :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
          <div class="tooltip-header">
            {{ tooltip.title }}
          </div>
          <div class="tooltip-content">
            <div v-if="tooltip.type === 'data'">
              <span class="tooltip-count">{{ tooltip.count }}</span>
              <span class="tooltip-label">{{ tooltip.entityType }}{{ tooltip.count !== 1 ? 's' : '' }}</span>
            </div>
            <div v-else>
              {{ tooltip.content }}
            </div>
          </div>
        </div>
      </div>

      <!-- Location List (for small datasets) -->
      <div v-if="showLocationList" class="location-list">
        <div class="location-list-header">
          Top Locations
        </div>
        <div class="location-items">
          <div
            v-for="location in topLocations"
            :key="location.countryCode"
            class="location-item"
            @click="selectLocation(location, location.type)"
          >
            <div class="location-flag">
              <span class="flag-emoji">{{ getFlagEmoji(location.countryCode) }}</span>
            </div>
            <div class="location-details">
              <div class="location-name">
                {{ location.countryName }}
              </div>
              <div class="location-count">
                {{ location.count }} {{ location.type }}{{ location.count !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref, computed, onMounted,
} from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

interface LocationData {
  countryCode: string
  countryName: string
  count: number
  latitude?: number
  longitude?: number
}

interface LocationMapData {
  members: LocationData[]
  organizations: LocationData[]
  totals: {
    members: number
    organizations: number
  }
}

const props = defineProps<{
  locationData: LocationMapData | null
  type: 'members' | 'organizations' | 'both'
  loading?: boolean
  error?: string
  showLocationList?: boolean
}>();

const emit = defineEmits<{
  locationSelected: [location: LocationData, entityType: string]
  countrySelected: [countryCode: string]
}>();

// Reactive data
const mapSvg = ref<SVGElement>();
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  content: '',
  count: 0,
  entityType: '',
  type: 'country',
});

// Country position mapping (rough approximation for SVG coordinates)
const countryPositions = {
  US: { x: 250, y: 240 },
  CA: { x: 220, y: 180 },
  GB: { x: 480, y: 160 },
  DE: { x: 520, y: 170 },
  FR: { x: 500, y: 190 },
  ES: { x: 480, y: 220 },
  IT: { x: 530, y: 210 },
  NL: { x: 510, y: 160 },
  BE: { x: 505, y: 165 },
  CH: { x: 520, y: 180 },
  AT: { x: 540, y: 175 },
  SE: { x: 540, y: 120 },
  NO: { x: 520, y: 100 },
  DK: { x: 525, y: 140 },
  FI: { x: 560, y: 110 },
  JP: { x: 860, y: 200 },
  CN: { x: 750, y: 180 },
  IN: { x: 700, y: 220 },
  AU: { x: 820, y: 350 },
  BR: { x: 350, y: 320 },
  MX: { x: 200, y: 280 },
  RU: { x: 650, y: 120 },
  ZA: { x: 550, y: 370 },
};

// Computed properties
const topLocations = computed(() => {
  const locations: (LocationData & { type: string })[] = [];

  if (props.type === 'members' || props.type === 'both') {
    props.locationData?.members?.slice(0, 5).forEach((member) => {
      locations.push({ ...member, type: 'member' });
    });
  }

  if (props.type === 'organizations' || props.type === 'both') {
    props.locationData?.organizations?.slice(0, 5).forEach((org) => {
      locations.push({ ...org, type: 'organization' });
    });
  }

  return locations.sort((a, b) => b.count - a.count).slice(0, 8);
});

// Methods
const getCountryX = (countryCode: string): number => countryPositions[countryCode]?.x || 500;

const getCountryY = (countryCode: string): number => countryPositions[countryCode]?.y || 250;

const getPointRadius = (count: number, entityType: string): number => {
  const maxCount = entityType === 'members'
    ? Math.max(...(props.locationData?.members?.map((m) => m.count) || [1]))
    : Math.max(...(props.locationData?.organizations?.map((o) => o.count) || [1]));

  const minRadius = 3;
  const maxRadius = 20;
  const ratio = count / maxCount;

  return minRadius + (maxRadius - minRadius) * ratio;
};

const getFlagEmoji = (countryCode: string): string => {
  const flagMap: Record<string, string> = {
    US: '🇺🇸',
    CA: '🇨🇦',
    GB: '🇬🇧',
    DE: '🇩🇪',
    FR: '🇫🇷',
    ES: '🇪🇸',
    IT: '🇮🇹',
    NL: '🇳🇱',
    BE: '🇧🇪',
    CH: '🇨🇭',
    AT: '🇦🇹',
    SE: '🇸🇪',
    NO: '🇳🇴',
    DK: '🇩🇰',
    FI: '🇫🇮',
    JP: '🇯🇵',
    CN: '🇨🇳',
    IN: '🇮🇳',
    AU: '🇦🇺',
    BR: '🇧🇷',
    MX: '🇲🇽',
    RU: '🇷🇺',
    ZA: '🇿🇦',
  };
  return flagMap[countryCode] || '🌍';
};

const showDataTooltip = (event: MouseEvent, location: LocationData, entityType: string) => {
  const rect = mapSvg.value?.getBoundingClientRect();
  if (!rect) return;

  tooltip.value = {
    visible: true,
    x: event.clientX - rect.left + 10,
    y: event.clientY - rect.top - 10,
    title: location.countryName,
    content: '',
    count: location.count,
    entityType,
    type: 'data',
  };
};

const showCountryTooltip = (event: MouseEvent, countryCode: string) => {
  const rect = mapSvg.value?.getBoundingClientRect();
  if (!rect) return;

  tooltip.value = {
    visible: true,
    x: event.clientX - rect.left + 10,
    y: event.clientY - rect.top - 10,
    title: countryCode,
    content: 'Click to filter by this region',
    count: 0,
    entityType: '',
    type: 'country',
  };
};

const hideTooltip = () => {
  tooltip.value.visible = false;
};

const selectLocation = (location: LocationData, entityType: string) => {
  emit('locationSelected', location, entityType);
};

const selectCountry = (countryCode: string) => {
  emit('countrySelected', countryCode);
};

// Lifecycle
onMounted(() => {
  // Additional initialization if needed
});
</script>

<script lang="ts">
export default {
  name: 'DashboardWorldMap',
};
</script>

<style lang="scss" scoped>
.world-map-container {
  @apply w-full h-full min-h-80;
}

.loading-container {
  @apply w-full h-64 flex items-center justify-center;
}

.error-container {
  @apply w-full h-64 flex items-center justify-center text-red-600;
}

.world-map-wrapper {
  @apply w-full h-full flex flex-col;
}

.map-legend {
  @apply flex items-center gap-4 mb-4 px-2;

  .legend-item {
    @apply flex items-center gap-2;

    .legend-color {
      @apply w-3 h-3 rounded-full;

      &.member-color {
        @apply bg-blue-500;
      }

      &.org-color {
        @apply bg-green-500;
      }
    }

    .legend-text {
      @apply text-sm text-gray-600 font-medium;
    }
  }
}

.map-svg-container {
  @apply relative flex-1;
}

.world-map-svg {
  @apply w-full h-full;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;

  .countries {
    .country-path {
      @apply fill-gray-200 stroke-gray-300 stroke-1 cursor-pointer transition-all duration-200;

      &:hover {
        @apply fill-gray-300 stroke-gray-400;
      }
    }
  }

  .data-points {
    .member-point {
      @apply fill-blue-500 stroke-blue-600 stroke-1 cursor-pointer transition-all duration-200;
      opacity: 0.8;

      &:hover {
        @apply fill-blue-600 stroke-blue-700;
        opacity: 1;
        transform: scale(1.1);
      }
    }

    .org-point {
      @apply fill-green-500 stroke-green-600 stroke-1 cursor-pointer transition-all duration-200;
      opacity: 0.8;

      &:hover {
        @apply fill-green-600 stroke-green-700;
        opacity: 1;
        transform: scale(1.1);
      }
    }
  }
}

.map-tooltip {
  @apply absolute bg-gray-900 text-white rounded-lg px-3 py-2 text-sm z-20 pointer-events-none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  .tooltip-header {
    @apply font-semibold mb-1;
  }

  .tooltip-content {
    @apply flex items-center gap-1;

    .tooltip-count {
      @apply font-bold text-lg;
    }

    .tooltip-label {
      @apply text-gray-300;
    }
  }
}

.location-list {
  @apply mt-6 bg-gray-50 rounded-lg p-4;

  .location-list-header {
    @apply text-sm font-semibold text-gray-700 mb-3;
  }

  .location-items {
    @apply space-y-2;
  }

  .location-item {
    @apply flex items-center gap-3 p-2 bg-white rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm hover:bg-gray-50;

    .location-flag {
      .flag-emoji {
        @apply text-xl;
      }
    }

    .location-details {
      @apply flex-1;

      .location-name {
        @apply text-sm font-medium text-gray-900;
      }

      .location-count {
        @apply text-xs text-gray-500;
      }
    }
  }
}
</style>
