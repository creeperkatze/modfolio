<template>
	<div
		class="min-h-screen flex flex-col justify-center items-center pt-10 px-5 pb-0 font-medium text-text-primary overflow-y-auto"
	>
		<div
			class="bg-card-bg border border-border-dark rounded-2xl p-4 lg:p-8 max-w-[1200px] w-full shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
		>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
				<!-- Left column: Configuration -->
				<div>
					<a href="/" class="inline-flex items-center gap-2 no-underline mb-2">
						<svg class="h-10 w-10" viewBox="0 0 110 100" xmlns="http://www.w3.org/2000/svg">
							<g class="dynamic-fill" transform="translate(-195.12051,-249.04304)">
								<g transform="matrix(1.2138597,0,0,1.2138597,-53.114434,-63.81136)">
									<rect width="60" height="20" x="205.12053" y="259.04303" ry="10" />
									<rect width="20" height="20" x="275.12051" y="259.04303" ry="10" />
									<rect width="90" height="20" x="205.12053" y="319.04303" ry="10" />
									<rect width="90" height="20" x="204.50052" y="289.04303" ry="10" />
								</g>
							</g>
						</svg>
						<h1 class="dynamic-color text-5xl font-black leading-none">Modfolio</h1>
					</a>
					<p class="mb-4 text-sm opacity-80">{{ t(m.appSubtitle.id) }}</p>

					<!-- Configuration Section -->
					<CollapsibleSection :title="t(m.sectionConfiguration.id)" :start-expanded="true">
						<div class="mb-2">
							<h3 class="text-text-secondary text-base font-semibold mt-2 mb-1">
								{{ t(m.fieldUrl.id) }}
							</h3>
							<input
								v-model="urlInput"
								type="text"
								:placeholder="`https://www.${platformConfig.baseUrl}/${platformConfig.projectPath}/example`"
								class="w-full py-2.5 px-3 bg-input-bg border-2 border-transparent rounded-xl text-text-bright text-sm font-medium transition-[border-color] duration-100 focus:outline-none"
								@input="onUrlInput"
								@paste="onUrlPaste"
							/>
						</div>

						<hr class="my-4 border-0 border-t border-border-dark" />

						<PlatformSelector :selected="selectedPlatform" @select="setPlatform" />

						<hr class="my-4 border-0 border-t border-border-dark" />

						<div class="mb-2">
							<h3 class="text-text-secondary text-base font-semibold mb-1">
								{{ t(m.fieldType.id) }}
							</h3>
							<select
								v-model="embedType"
								class="w-full py-2.5 px-3 bg-input-bg border-2 border-transparent rounded-xl text-text-bright text-sm font-medium transition-[border-color] duration-100 focus:outline-none"
								@change="onConfigChange"
							>
								<option value="card">{{ t(m.typeCard.id) }}</option>
								<option value="badge">{{ t(m.typeBadge.id) }}</option>
							</select>
						</div>

						<div class="mb-2">
							<h3 class="text-text-secondary text-base font-semibold mb-1">
								{{ t(m.fieldTarget.id) }}
							</h3>
							<select
								v-model="targetType"
								class="w-full py-2.5 px-3 bg-input-bg border-2 border-transparent rounded-xl text-text-bright text-sm font-medium transition-[border-color] duration-100 focus:outline-none"
								@change="onTargetChange"
							>
								<option v-for="tgt in platformConfig.targets" :key="tgt" :value="tgt">
									{{ targetLabel(tgt) }}
								</option>
							</select>
						</div>

						<div v-if="embedType === 'badge'" class="mb-2">
							<h3 class="text-text-secondary text-base font-semibold mb-1">
								{{ t(m.fieldBadgeMetric.id) }}
							</h3>
							<select
								v-model="badgeMetric"
								class="w-full py-2.5 px-3 bg-input-bg border-2 border-transparent rounded-xl text-text-bright text-sm font-medium transition-[border-color] duration-100 focus:outline-none"
								@change="onOptionChange"
							>
								<option v-for="metric in availableMetrics" :key="metric" :value="metric">
									{{ metricLabel(metric) }}
								</option>
							</select>
						</div>

						<div class="mb-2">
							<h3 class="text-text-secondary text-base font-semibold mb-1">{{ valueLabel }}</h3>
							<input
								v-model="identifier"
								type="text"
								:placeholder="valuePlaceholder"
								class="w-full py-2.5 px-3 bg-input-bg border-2 border-transparent rounded-xl text-text-bright text-sm font-medium transition-[border-color] duration-100 focus:outline-none"
								@input="onIdentifierInput"
								@paste="onIdentifierPaste"
							/>
						</div>

						<div
							v-if="embedType === 'card' && isUserLike && platformConfig.projectTypeOptions"
							class="mb-2"
						>
							<h3 class="text-text-secondary text-base font-semibold mb-1">
								{{ t(m.fieldProjectType.id) }}
							</h3>
							<select
								v-model="projectTypeFilter"
								class="w-full py-2.5 px-3 bg-input-bg border-2 border-transparent rounded-xl text-text-bright text-sm font-medium transition-[border-color] duration-100 focus:outline-none"
								@change="onOptionChange"
							>
								<option
									v-for="opt in platformConfig.projectTypeOptions"
									:key="opt.value"
									:value="opt.value"
								>
									{{ projectTypeLabel(opt) }}
								</option>
							</select>
						</div>
					</CollapsibleSection>

					<!-- Customization Section -->
					<CollapsibleSection ref="customizationSection" :title="t(m.sectionCustomization.id)">
						<ToggleCheckbox
							v-if="showProjectsVisible"
							v-model="showProjects"
							:label="t(m.optionShowProjects.id)"
							@update:model-value="onOptionChange"
						/>
						<RangeSlider
							v-if="showProjectsVisible && showProjects"
							v-model="maxProjects"
							:label="t(m.optionMaxProjects.id)"
							:max="CARD_LIMITS.MAX_COUNT"
							@update:model-value="onDebouncedChange"
						/>

						<ToggleCheckbox
							v-if="showVersionsVisible"
							v-model="showVersions"
							:label="versionsLabel"
							@update:model-value="onOptionChange"
						/>
						<RangeSlider
							v-if="showVersionsVisible && showVersions"
							v-model="maxVersions"
							:label="maxVersionsLabel"
							:max="CARD_LIMITS.MAX_COUNT"
							@update:model-value="onDebouncedChange"
						/>

						<ToggleCheckbox
							v-if="relativeTimeVisible"
							v-model="relativeTime"
							:label="t(m.optionRelativeTime.id)"
							@update:model-value="onOptionChange"
						/>
						<ToggleCheckbox
							v-if="sparklinesVisible"
							v-model="showSparklines"
							:label="t(m.optionSparklines.id)"
							@update:model-value="onOptionChange"
						/>
						<ToggleCheckbox
							v-if="sparklinesVisible"
							v-model="showDownloadBars"
							:label="t(m.optionDownloadBars.id)"
							@update:model-value="onOptionChange"
						/>
						<ToggleCheckbox
							v-if="embedType === 'badge'"
							v-model="showIcon"
							:label="t(m.optionShowIcon.id)"
							@update:model-value="onOptionChange"
						/>
						<ToggleCheckbox
							v-model="showBorder"
							:label="t(m.optionShowBorder.id)"
							@update:model-value="onOptionChange"
						/>
						<ToggleCheckbox
							v-model="animations"
							:label="t(m.optionAnimations.id)"
							@update:model-value="onOptionChange"
						/>

						<ColorPalette
							:label="t(m.optionAccentColor.id)"
							:model-value="selectedColor"
							:preset-colors="accentPresets"
							@update:model-value="onAccentChange"
						/>

						<div class="mt-2">
							<ColorPalette
								:label="t(m.optionBgColor.id)"
								:model-value="selectedBgColor"
								:preset-colors="BG_COLORS"
								@update:model-value="onBgChange"
							/>
							<div
								v-if="selectedBgColor !== null"
								class="bg-yellow/10 border border-yellow/30 rounded-lg px-3 py-2 text-sm text-yellow flex items-center gap-2 mt-2"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path
										d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
									/>
									<path d="M12 9v4" />
									<path d="M12 17h.01" />
								</svg>
								<span>{{ t(m.hintTransparentBg.id) }}</span>
							</div>
						</div>
					</CollapsibleSection>
				</div>

				<!-- Right column: Preview & Output -->
				<div class="flex flex-col gap-4">
					<div>
						<h2 class="flex justify-between items-center text-text-secondary text-lg font-semibold">
							<span>{{ t(m.sectionPreview.id) }}</span>
							<span class="flex items-center gap-1">
								<svg
									v-if="!loading && generationTime"
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="text-yellow"
								>
									<path
										d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
									/>
								</svg>
								<svg
									v-if="loading"
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="text-yellow loader-icon"
								>
									<path d="M21 12a9 9 0 1 1-6.219-8.56" />
								</svg>
								<span v-if="generationTime" class="text-yellow">{{ generationTime }}ms</span>
							</span>
						</h2>

						<div
							v-if="apiSlow"
							class="mb-3 bg-yellow/10 border border-yellow/30 rounded-lg px-3 py-2 text-sm text-yellow"
						>
							<span class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path
										d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
									/>
									<path d="M12 9v4" />
									<path d="M12 17h.01" />
								</svg>
								<span>{{ t(m.warningApiSlow.id, { platform: platformConfig.name }) }}</span>
							</span>
						</div>

						<div
							v-if="apiError"
							class="mb-3 bg-red/10 border border-red/30 rounded-lg px-3 py-2 text-sm text-red"
						>
							<span class="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<circle cx="12" cy="12" r="10" />
									<line x1="12" x2="12" y1="8" y2="12" />
									<line x1="12" x2="12.01" y1="16" y2="16" />
								</svg>
								<span>{{ t(m.errorApiDown.id, { platform: platformConfig.name }) }}</span>
							</span>
						</div>

						<div
							class="bg-section-bg border border-border-dark rounded-xl min-h-[460px] flex items-center justify-center text-text-muted p-4"
						>
							<span v-if="!previewSrc">{{ t(m.previewPlaceholder.id) }}</span>
							<a v-else :href="targetUrl" target="_blank">
								<img :src="previewSrc" :alt="t(m.previewImageAlt.id)" class="max-w-full" />
							</a>
						</div>
					</div>

					<div>
						<h2 class="text-text-secondary text-lg font-semibold">{{ t(m.sectionMarkdown.id) }}</h2>
						<div
							class="bg-section-bg border border-border-dark rounded-xl p-3 flex items-center font-mono text-xs break-all"
							:class="markdownText ? 'text-text-bright' : 'text-text-muted'"
						>
							{{ markdownText || t(m.outputMarkdownPlaceholder.id) }}
						</div>
					</div>

					<div>
						<h2 class="text-text-secondary text-lg font-semibold">{{ t(m.sectionHtml.id) }}</h2>
						<div
							class="bg-section-bg border border-border-dark rounded-xl p-3 flex items-center font-mono text-xs break-all"
							:class="htmlText ? 'text-text-bright' : 'text-text-muted'"
						>
							{{ htmlText || t(m.outputHtmlPlaceholder.id) }}
						</div>
					</div>

					<div>
						<h2 class="text-text-secondary text-lg font-semibold">{{ t(m.sectionUrl.id) }}</h2>
						<div
							class="bg-section-bg border border-border-dark rounded-xl p-3 flex items-center font-mono text-xs break-all"
							:class="urlText ? 'text-text-bright' : 'text-text-muted'"
						>
							{{ urlText || t(m.outputUrlPlaceholder.id) }}
						</div>
					</div>

					<div class="flex flex-wrap gap-2">
						<button
							:disabled="!embedUrl"
							class="py-2.5 px-4 text-black border-none rounded-xl text-sm font-semibold cursor-pointer transition-[filter] duration-200 hover:brightness-110 flex items-center gap-2 disabled:bg-input-bg disabled:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
							:style="embedUrl ? { backgroundColor: '#' + platformConfig.defaultColor } : {}"
							@click="copy('markdown')"
						>
							<span>{{ copyLabels.markdown }}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3" />
								<path d="M8 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" />
							</svg>
						</button>

						<button
							:disabled="!embedUrl"
							class="py-2.5 px-4 text-black border-none rounded-xl text-sm font-semibold cursor-pointer transition-[filter] duration-200 hover:brightness-110 flex items-center gap-2 disabled:bg-input-bg disabled:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
							:style="embedUrl ? { backgroundColor: '#' + platformConfig.defaultColor } : {}"
							@click="copy('html')"
						>
							<span>{{ copyLabels.html }}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="m16 18 6-6-6-6" />
								<path d="m8 6-6 6 6 6" />
							</svg>
						</button>

						<button
							:disabled="!embedUrl"
							class="py-2.5 px-4 text-black border-none rounded-xl text-sm font-semibold cursor-pointer transition-[filter] duration-200 hover:brightness-110 flex items-center gap-2 disabled:bg-input-bg disabled:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
							:style="embedUrl ? { backgroundColor: '#' + platformConfig.defaultColor } : {}"
							@click="copy('url')"
						>
							<span>{{ copyLabels.url }}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 126.644 96"
								fill="currentColor"
							>
								<path
									d="M81.15,0c-1.2376,2.1973-2.3489,4.4704-3.3591,6.794-9.5975-1.4396-19.3718-1.4396-28.9945,0-.985-2.3236-2.1216-4.5967-3.3591-6.794-9.0166,1.5407-17.8059,4.2431-26.1405,8.0568C2.779,32.5304-1.6914,56.3725.5312,79.8863c9.6732,7.1476,20.5083,12.603,32.0505,16.0884,2.6014-3.4854,4.8998-7.1981,6.8698-11.0623-3.738-1.3891-7.3497-3.1318-10.8098-5.1523.9092-.6567,1.7932-1.3386,2.6519-1.9953,20.281,9.547,43.7696,9.547,64.0758,0,.8587.7072,1.7427,1.3891,2.6519,1.9953-3.4601,2.0457-7.0718,3.7632-10.835,5.1776,1.97,3.8642,4.2683,7.5769,6.8698,11.0623,11.5419-3.4854,22.3769-8.9156,32.0509-16.0631,2.626-27.2771-4.496-50.9172-18.817-71.8548C98.9811,4.2684,90.1918,1.5659,81.1752.0505l-.0252-.0505ZM42.2802,65.4144c-6.2383,0-11.4159-5.6575-11.4159-12.6535s4.9755-12.6788,11.3907-12.6788,11.5169,5.708,11.4159,12.6788c-.101,6.9708-5.026,12.6535-11.3907,12.6535ZM84.3576,65.4144c-6.2637,0-11.3907-5.6575-11.3907-12.6535s4.9755-12.6788,11.3907-12.6788,11.4917,5.708,11.3906,12.6788c-.101,6.9708-5.026,12.6535-11.3906,12.6535Z"
								/>
							</svg>
						</button>

						<button
							class="py-2.5 px-4 bg-input-bg text-text-bright border border-border-dark rounded-xl text-sm font-semibold flex items-center gap-2 hover:brightness-110 cursor-pointer transition-[filter] duration-200"
							@click="resetToDefaults"
						>
							<span>{{ t(m.actionReset.id) }}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
								<path d="M3 3v5h5" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>

		<footer class="text-center py-8 px-5 pt-8 text-base text-text-muted font-semibold">
			Made with &hearts; by
			<a href="https://github.com/creeperkatze" target="_blank" class="dynamic-link no-underline"
				>Creeperkatze</a
			>
			&middot; View
			<a
				href="https://github.com/creeperkatze/modfolio"
				target="_blank"
				class="dynamic-link no-underline"
				>Source</a
			>
			&middot; View <a href="/docs" class="dynamic-link no-underline">API Docs</a> &middot;
			<a
				href="https://github.com/creeperkatze/modfolio"
				target="_blank"
				class="no-underline"
				style="color: #fbbf24"
				>&starf; On Github</a
			>
			&middot; Not affiliated with Modrinth, CurseForge, Hangar or Spigot
		</footer>
	</div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CollapsibleSection from './components/CollapsibleSection.vue'
import ColorPalette from './components/ColorPalette.vue'
import PlatformSelector from './components/PlatformSelector.vue'
import RangeSlider from './components/RangeSlider.vue'
import ToggleCheckbox from './components/ToggleCheckbox.vue'
import { defineMessages } from './helpers/i18n.js'
import { BG_COLORS, CARD_LIMITS, getAccentColors, parseUrl, PLATFORMS } from './platforms.js'

const { t } = useI18n()

// ── Messages (extracted by @formatjs/cli) ──
const m = defineMessages({
	appSubtitle: {
		id: 'app.subtitle',
		defaultMessage:
			'Generate fast, beautiful and consistent embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.',
	},

	sectionConfiguration: { id: 'section.configuration', defaultMessage: 'Configuration' },
	sectionCustomization: { id: 'section.customization', defaultMessage: 'Customization' },
	sectionPreview: { id: 'section.preview', defaultMessage: 'Preview' },
	sectionMarkdown: { id: 'section.markdown', defaultMessage: 'Markdown' },
	sectionHtml: { id: 'section.html', defaultMessage: 'HTML' },
	sectionUrl: { id: 'section.url', defaultMessage: 'URL' },

	fieldUrl: { id: 'field.url', defaultMessage: 'URL' },
	fieldType: { id: 'field.type', defaultMessage: 'Type' },
	fieldTarget: { id: 'field.target', defaultMessage: 'Target' },
	fieldBadgeMetric: { id: 'field.badgeMetric', defaultMessage: 'Badge Metric' },
	fieldProjectType: { id: 'field.projectType', defaultMessage: 'Project Type' },

	typeCard: { id: 'type.card', defaultMessage: 'Card' },
	typeBadge: { id: 'type.badge', defaultMessage: 'Badge' },

	targetUser: { id: 'target.user', defaultMessage: 'User' },
	targetProject: { id: 'target.project', defaultMessage: 'Project' },
	targetOrganization: { id: 'target.organization', defaultMessage: 'Organization' },
	targetCollection: { id: 'target.collection', defaultMessage: 'Collection' },
	targetServer: { id: 'target.server', defaultMessage: 'Server' },
	targetAuthor: { id: 'target.author', defaultMessage: 'Author' },
	targetResource: { id: 'target.resource', defaultMessage: 'Resource' },

	optionShowProjects: { id: 'option.showProjects', defaultMessage: 'Show Projects' },
	optionMaxProjects: { id: 'option.maxProjects', defaultMessage: 'Max Projects' },
	optionShowVersions: { id: 'option.showVersions', defaultMessage: 'Show Versions' },
	optionShowFiles: { id: 'option.showFiles', defaultMessage: 'Show Files' },
	optionMaxVersions: { id: 'option.maxVersions', defaultMessage: 'Max Versions' },
	optionMaxFiles: { id: 'option.maxFiles', defaultMessage: 'Max Files' },
	optionRelativeTime: { id: 'option.relativeTime', defaultMessage: 'Relative Time' },
	optionSparklines: { id: 'option.sparklines', defaultMessage: 'Sparkline Graphs' },
	optionDownloadBars: { id: 'option.downloadBars', defaultMessage: 'Download Bars' },
	optionShowIcon: { id: 'option.showIcon', defaultMessage: 'Show Platform Icon' },
	optionShowBorder: { id: 'option.showBorder', defaultMessage: 'Show Border' },
	optionAnimations: { id: 'option.animations', defaultMessage: 'Animations' },
	optionAccentColor: { id: 'option.accentColor', defaultMessage: 'Accent Color' },
	optionBgColor: { id: 'option.bgColor', defaultMessage: 'Background Color' },

	valueLabelUserCurseforge: { id: 'valueLabel.user.curseforge', defaultMessage: 'User ID' },
	valueLabelUserDefault: { id: 'valueLabel.user.default', defaultMessage: 'Username' },
	valueLabelProjectCurseforge: {
		id: 'valueLabel.project.curseforge',
		defaultMessage: 'Project ID',
	},
	valueLabelProjectSpigot: { id: 'valueLabel.project.spigot', defaultMessage: 'Project ID' },
	valueLabelProjectDefault: { id: 'valueLabel.project.default', defaultMessage: 'Project Slug' },
	valueLabelOrganization: { id: 'valueLabel.organization', defaultMessage: 'Organization Slug' },
	valueLabelCollection: { id: 'valueLabel.collection', defaultMessage: 'Collection ID' },
	valueLabelAuthor: { id: 'valueLabel.author', defaultMessage: 'Author ID' },
	valueLabelResource: { id: 'valueLabel.resource', defaultMessage: 'Resource ID' },
	valueLabelServer: { id: 'valueLabel.server', defaultMessage: 'Server Slug' },
	valueLabelDefault: { id: 'valueLabel.default', defaultMessage: 'Value' },

	placeholderUserCurseforge: { id: 'placeholder.user.curseforge', defaultMessage: 'Enter user ID' },
	placeholderUserDefault: {
		id: 'placeholder.user.default',
		defaultMessage: 'Enter username or ID',
	},
	placeholderProjectCurseforge: {
		id: 'placeholder.project.curseforge',
		defaultMessage: 'Enter project ID',
	},
	placeholderProjectDefault: {
		id: 'placeholder.project.default',
		defaultMessage: 'Enter project ID or slug',
	},
	placeholderOrganization: {
		id: 'placeholder.organization',
		defaultMessage: 'Enter organization slug or ID',
	},
	placeholderCollection: { id: 'placeholder.collection', defaultMessage: 'Enter collection ID' },
	placeholderAuthor: { id: 'placeholder.author', defaultMessage: 'Enter author ID' },
	placeholderResource: { id: 'placeholder.resource', defaultMessage: 'Enter resource ID' },
	placeholderServer: { id: 'placeholder.server', defaultMessage: 'Enter server slug' },

	metricDownloads: { id: 'metric.downloads', defaultMessage: 'Downloads' },
	metricFollowers: { id: 'metric.followers', defaultMessage: 'Followers' },
	metricProjects: { id: 'metric.projects', defaultMessage: 'Projects' },
	metricRank: { id: 'metric.rank', defaultMessage: 'Rank' },
	metricStars: { id: 'metric.stars', defaultMessage: 'Stars' },
	metricVersions: { id: 'metric.versions', defaultMessage: 'Versions' },
	metricViews: { id: 'metric.views', defaultMessage: 'Views' },
	metricLikes: { id: 'metric.likes', defaultMessage: 'Likes' },
	metricResources: { id: 'metric.resources', defaultMessage: 'Resources' },
	metricRating: { id: 'metric.rating', defaultMessage: 'Rating' },
	metricPlayers: { id: 'metric.players', defaultMessage: 'Players Online' },

	projectTypeAll: { id: 'projectType.all', defaultMessage: 'All Types' },
	projectTypeMod: { id: 'projectType.mod', defaultMessage: 'Mods' },
	projectTypeModpack: { id: 'projectType.modpack', defaultMessage: 'Modpacks' },
	projectTypeResourcepack: { id: 'projectType.resourcepack', defaultMessage: 'Resource Packs' },
	projectTypeShader: { id: 'projectType.shader', defaultMessage: 'Shaders' },
	projectTypeDatapack: { id: 'projectType.datapack', defaultMessage: 'Data Packs' },
	projectTypePlugin: { id: 'projectType.plugin', defaultMessage: 'Plugins' },
	projectTypeTexturePack: { id: 'projectType.texturePack', defaultMessage: 'Texture Packs' },
	projectTypeBukkitPlugin: { id: 'projectType.bukkitPlugin', defaultMessage: 'Bukkit Plugins' },

	hintTransparentBg: {
		id: 'hint.transparentBg',
		defaultMessage:
			'Transparent works best in most situations, as it blends in with the background without changing its style.',
	},
	warningApiSlow: {
		id: 'warning.apiSlow',
		defaultMessage: 'The {platform} API is responding slowly. Embeds may take longer to load.',
	},
	errorApiDown: { id: 'error.apiDown', defaultMessage: 'The {platform} API is currently down.' },

	previewPlaceholder: { id: 'preview.placeholder', defaultMessage: 'Your embed will appear here' },
	previewImageAlt: { id: 'preview.imageAlt', defaultMessage: 'Preview' },

	outputMarkdownPlaceholder: {
		id: 'output.markdownPlaceholder',
		defaultMessage: 'Your markdown code will appear here',
	},
	outputHtmlPlaceholder: {
		id: 'output.htmlPlaceholder',
		defaultMessage: 'Your HTML code will appear here',
	},
	outputUrlPlaceholder: {
		id: 'output.urlPlaceholder',
		defaultMessage: 'Your URL will appear here',
	},

	actionCopyMarkdown: { id: 'action.copyMarkdown', defaultMessage: 'Copy Markdown' },
	actionCopyHtml: { id: 'action.copyHtml', defaultMessage: 'Copy HTML' },
	actionCopyUrl: { id: 'action.copyUrl', defaultMessage: 'Copy URL' },
	actionCopied: { id: 'action.copied', defaultMessage: 'Copied!' },
	actionReset: { id: 'action.reset', defaultMessage: 'Reset' },
})

// ── Helpers ──
function targetLabel(target) {
	const key = `target.${target}`
	return t(key)
}

function metricLabel(metric) {
	const key = `metric.${metric}`
	return t(key)
}

// Map platforms.js project type option labels to message IDs
const PROJECT_TYPE_MESSAGE_IDS = {
	'All Types': m.projectTypeAll.id,
	Mods: m.projectTypeMod.id,
	Modpacks: m.projectTypeModpack.id,
	'Resource Packs': m.projectTypeResourcepack.id,
	Shaders: m.projectTypeShader.id,
	'Data Packs': m.projectTypeDatapack.id,
	Plugins: m.projectTypePlugin.id,
	'Texture Packs': m.projectTypeTexturePack.id,
	'Bukkit Plugins': m.projectTypeBukkitPlugin.id,
}

function projectTypeLabel(opt) {
	const id = PROJECT_TYPE_MESSAGE_IDS[opt.label]
	return id ? t(id) : opt.label
}

// ── Reactive state ──
const selectedPlatform = ref('modrinth')
const embedType = ref('card')
const targetType = ref('user')
const badgeMetric = ref('downloads')
const identifier = ref('')
const urlInput = ref('')

const showProjects = ref(true)
const maxProjects = ref(CARD_LIMITS.DEFAULT_COUNT)
const showVersions = ref(true)
const maxVersions = ref(CARD_LIMITS.DEFAULT_COUNT)
const relativeTime = ref(true)
const showSparklines = ref(true)
const showDownloadBars = ref(true)
const showIcon = ref(true)
const showBorder = ref(true)
const animations = ref(true)
const selectedColor = ref('1bd96a')
const selectedBgColor = ref(null)

const projectTypeFilter = ref('')

const loading = ref(false)
const generationTime = ref(null)
const apiSlow = ref(false)
const apiError = ref(false)
const previewSrc = ref(null)
const metaName = ref('')
const metaUrl = ref(null)
const curseforgeSlug = ref(null)

const copyLabels = ref({
	markdown: t(m.actionCopyMarkdown.id),
	html: t(m.actionCopyHtml.id),
	url: t(m.actionCopyUrl.id),
})

const customizationSection = ref(null)

// ── Computed ──
const platformConfig = computed(() => PLATFORMS[selectedPlatform.value])

const availableMetrics = computed(() => {
	const metrics =
		platformConfig.value.badgeMetrics[targetType.value] ||
		platformConfig.value.badgeMetrics[platformConfig.value.targets[0]]
	return metrics || ['downloads']
})

const accentPresets = computed(() =>
	getAccentColors(selectedPlatform.value).map((c) => ({ name: c, value: c })),
)

const isProject = computed(() => ['project', 'resource'].includes(targetType.value))
const isUserLike = computed(() => {
	const tgt = targetType.value
	if (['user', 'organization', 'collection'].includes(tgt)) return true
	if (selectedPlatform.value === 'spigot' && tgt === 'author') return true
	return false
})

const showProjectsVisible = computed(() => embedType.value === 'card' && isUserLike.value)
const showVersionsVisible = computed(() => embedType.value === 'card' && isProject.value)
const relativeTimeVisible = computed(
	() => embedType.value === 'card' && isProject.value && showVersions.value,
)
const sparklinesVisible = computed(() => embedType.value === 'card' && isUserLike.value)

const versionsLabel = computed(() =>
	selectedPlatform.value === 'curseforge' ? t(m.optionShowFiles.id) : t(m.optionShowVersions.id),
)
const maxVersionsLabel = computed(() =>
	selectedPlatform.value === 'curseforge' ? t(m.optionMaxFiles.id) : t(m.optionMaxVersions.id),
)

const valueLabel = computed(() => {
	const platform = selectedPlatform.value
	switch (targetType.value) {
		case 'user':
			return platform === 'curseforge'
				? t(m.valueLabelUserCurseforge.id)
				: t(m.valueLabelUserDefault.id)
		case 'project':
			return platform === 'curseforge' || platform === 'spigot'
				? t(m.valueLabelProjectCurseforge.id)
				: t(m.valueLabelProjectDefault.id)
		case 'organization':
			return t(m.valueLabelOrganization.id)
		case 'collection':
			return t(m.valueLabelCollection.id)
		case 'author':
			return t(m.valueLabelAuthor.id)
		case 'resource':
			return t(m.valueLabelResource.id)
		case 'server':
			return t(m.valueLabelServer.id)
		default:
			return t(m.valueLabelDefault.id)
	}
})

const valuePlaceholder = computed(() => {
	const platform = selectedPlatform.value
	switch (targetType.value) {
		case 'user':
			return platform === 'curseforge'
				? t(m.placeholderUserCurseforge.id)
				: t(m.placeholderUserDefault.id)
		case 'project':
			return platform === 'curseforge'
				? t(m.placeholderProjectCurseforge.id)
				: t(m.placeholderProjectDefault.id)
		case 'organization':
			return t(m.placeholderOrganization.id)
		case 'collection':
			return t(m.placeholderCollection.id)
		case 'author':
			return t(m.placeholderAuthor.id)
		case 'resource':
			return t(m.placeholderResource.id)
		case 'server':
			return t(m.placeholderServer.id)
		default:
			return ''
	}
})

// Build the embed URL
const embedUrl = computed(() => {
	const id = identifier.value.trim()
	if (!id) return null

	const config = platformConfig.value
	const platform = selectedPlatform.value
	const type = targetType.value

	if (embedType.value === 'badge') {
		const params = new URLSearchParams()
		if (selectedColor.value !== config.defaultColor) params.set('color', selectedColor.value)
		if (selectedBgColor.value !== null) params.set('backgroundColor', selectedBgColor.value)
		if (!showIcon.value) params.set('showIcon', 'false')
		if (!showBorder.value) params.set('showBorder', 'false')
		const q = params.toString()
		return `${window.location.origin}/${platform}/${type}/${id}/${badgeMetric.value}${q ? '?' + q : ''}`
	}

	// Card
	const params = new URLSearchParams()

	if (isUserLike.value) {
		if (!showProjects.value) params.set('showProjects', 'false')
		if (maxProjects.value !== CARD_LIMITS.DEFAULT_COUNT)
			params.set('maxProjects', maxProjects.value)
	}
	if (isProject.value) {
		if (!showVersions.value) params.set('showVersions', 'false')
		if (maxVersions.value !== CARD_LIMITS.DEFAULT_COUNT)
			params.set('maxVersions', maxVersions.value)
		if (!relativeTime.value) params.set('relativeTime', 'false')
	}
	if (isUserLike.value) {
		if (!showSparklines.value) params.set('showSparklines', 'false')
		if (!showDownloadBars.value) params.set('showDownloadBars', 'false')
		if (projectTypeFilter.value) {
			if (platform === 'curseforge') params.set('classId', projectTypeFilter.value)
			else params.set('projectType', projectTypeFilter.value)
		}
	}
	if (!showBorder.value) params.set('showBorder', 'false')
	if (!animations.value) params.set('animations', 'false')
	if (selectedColor.value !== config.defaultColor) params.set('color', selectedColor.value)
	if (selectedBgColor.value !== null) params.set('backgroundColor', selectedBgColor.value)

	const q = params.toString()
	return `${window.location.origin}/${platform}/${type}/${id}${q ? '?' + q : ''}`
})

const targetUrl = computed(() => {
	if (metaUrl.value) return metaUrl.value
	const config = platformConfig.value
	const id = identifier.value.trim()
	const type = targetType.value
	if (selectedPlatform.value === 'curseforge') {
		return type === 'user'
			? `https://www.${config.baseUrl}/${config.userPath}/${id}`
			: `https://www.${config.baseUrl}/${config.projectPath}/${curseforgeSlug.value || id}`
	}
	if (selectedPlatform.value === 'hangar') {
		return type === 'user'
			? `https://${config.baseUrl}/u/${id}`
			: `https://${config.baseUrl}/${config.projectPath}/${id}`
	}
	if (selectedPlatform.value === 'spigot') {
		return type === 'author'
			? `https://${config.baseUrl}/authors/${id}`
			: `https://${config.baseUrl}/${config.projectPath}/${id}/`
	}
	return `https://modrinth.com/${type}/${id}`
})

const markdownText = computed(() => {
	if (!embedUrl.value) return ''
	return `[![${metaName.value || identifier.value}](${embedUrl.value})](${targetUrl.value})`
})

const htmlText = computed(() => {
	if (!embedUrl.value) return ''
	return `<a href="${targetUrl.value}"><img src="${embedUrl.value}" alt="${metaName.value || identifier.value}" /></a>`
})

const urlText = computed(() => {
	if (!embedUrl.value) return ''
	return `${embedUrl.value}${embedUrl.value.includes('?') ? '&' : '?'}timestamp=${Date.now()}`
})

// ── Debounce ──
let debounceTimer = null
function debounce(fn, ms = 200) {
	clearTimeout(debounceTimer)
	debounceTimer = setTimeout(fn, ms)
}

// ── Methods ──
function setPlatform(platform) {
	selectedPlatform.value = platform
	selectedColor.value = PLATFORMS[platform].defaultColor
	targetType.value = PLATFORMS[platform].targets[0]
	badgeMetric.value = (PLATFORMS[platform].badgeMetrics[PLATFORMS[platform].targets[0]] || [
		'downloads',
	])[0]
	document.documentElement.style.setProperty(
		'--platform-color',
		`#${PLATFORMS[platform].defaultColor}`,
	)
	updateFavicon(`#${PLATFORMS[platform].defaultColor}`)
	resetToDefaults()
}

function resetToDefaults() {
	const config = platformConfig.value
	curseforgeSlug.value = null
	embedType.value = 'card'
	targetType.value = config.targets[0]
	badgeMetric.value = (config.badgeMetrics[config.targets[0]] || ['downloads'])[0]
	identifier.value = ''
	urlInput.value = ''
	projectTypeFilter.value = ''
	showProjects.value = true
	maxProjects.value = CARD_LIMITS.DEFAULT_COUNT
	showVersions.value = true
	maxVersions.value = CARD_LIMITS.DEFAULT_COUNT
	relativeTime.value = true
	showSparklines.value = true
	showDownloadBars.value = true
	showIcon.value = true
	showBorder.value = true
	animations.value = true
	selectedColor.value = config.defaultColor
	selectedBgColor.value = null
	previewSrc.value = null
	generationTime.value = null
	apiSlow.value = false
	apiError.value = false
	metaName.value = ''
	metaUrl.value = null
	updateBrowserUrl()
}

function onAccentChange(color) {
	selectedColor.value = color
	generate()
	updateBrowserUrl()
}

function onBgChange(color) {
	selectedBgColor.value = color
	generate()
	updateBrowserUrl()
}

function onConfigChange() {
	updateBrowserUrl()
	generate()
}

function onTargetChange() {
	projectTypeFilter.value = ''
	onConfigChange()
}

function onOptionChange() {
	updateBrowserUrl()
	generate()
}

function onDebouncedChange() {
	debounce(() => {
		updateBrowserUrl()
		generate()
	})
}

function onIdentifierInput() {
	debounce(() => {
		updateBrowserUrl()
		generate()
	})
}

function onIdentifierPaste() {
	setTimeout(() => {
		updateBrowserUrl()
		generate()
	}, 10)
}

async function onUrlInput() {
	const val = urlInput.value.trim()
	const parsed = parseUrl(val)
	if (!parsed) return

	if (selectedPlatform.value !== parsed.platform) {
		selectedPlatform.value = parsed.platform
		selectedColor.value = PLATFORMS[parsed.platform].defaultColor
		document.documentElement.style.setProperty(
			'--platform-color',
			`#${PLATFORMS[parsed.platform].defaultColor}`,
		)
		updateFavicon(`#${PLATFORMS[parsed.platform].defaultColor}`)
	}
	targetType.value = parsed.type

	if (parsed.isCurseForge) {
		if (parsed.type === 'project' && parsed.slug) {
			curseforgeSlug.value = parsed.slug
			try {
				const res = await fetch(`/curseforge/lookup/${encodeURIComponent(parsed.slug)}`)
				if (res.ok) {
					const data = await res.json()
					if (data.id) {
						identifier.value = String(data.id)
						updateBrowserUrl()
						generate()
						return
					}
				}
			} catch {
				/* ignore */
			}
			curseforgeSlug.value = null
		} else if (parsed.type === 'user') {
			projectTypeFilter.value = parsed.classId || ''
			curseforgeSlug.value = parsed.id
			try {
				const res = await fetch(`/curseforge/lookup/user/${encodeURIComponent(parsed.id)}`)
				if (res.ok) {
					const data = await res.json()
					if (data.id) {
						identifier.value = String(data.id)
						updateBrowserUrl()
						generate()
						return
					}
				}
			} catch {
				/* ignore */
			}
			curseforgeSlug.value = null
		} else {
			curseforgeSlug.value = null
			identifier.value = parsed.id
		}
	} else {
		curseforgeSlug.value = null
		identifier.value = parsed.id
		projectTypeFilter.value = parsed.projectType || ''
	}
	updateBrowserUrl()
	generate()
}

function onUrlPaste() {
	setTimeout(() => onUrlInput(), 10)
}

async function generate() {
	const id = identifier.value.trim()
	if (!id) {
		previewSrc.value = null
		generationTime.value = null
		apiSlow.value = false
		apiError.value = false
		metaName.value = ''
		metaUrl.value = null
		return
	}

	const startTime = performance.now()
	loading.value = true
	generationTime.value = null
	apiSlow.value = false
	apiError.value = false

	// Fetch meta
	const type = targetType.value
	const platform = selectedPlatform.value
	try {
		const metaPath =
			platform === 'curseforge'
				? `/curseforge/meta/${type}/${encodeURIComponent(id)}`
				: platform === 'hangar'
					? `/hangar/meta/${encodeURIComponent(id)}?type=${type}`
					: platform === 'spigot'
						? `/spigot/meta/${encodeURIComponent(id)}?type=${type}`
						: `/modrinth/meta/${type}/${encodeURIComponent(id)}`
		const res = await fetch(metaPath)
		if (res.ok) {
			const data = await res.json()
			if (data?.name) metaName.value = data.name
			if (data?.url) metaUrl.value = data.url
		}
	} catch {
		/* ignore */
	}

	// Load preview image
	const url = embedUrl.value
	if (!url) {
		loading.value = false
		return
	}

	const img = new Image()
	img.src = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`

	img.onload = async () => {
		const endTime = performance.now()
		generationTime.value = Math.round(endTime - startTime)
		loading.value = false
		previewSrc.value = img.src

		try {
			const res = await fetch(url, { method: 'HEAD' })
			const errorStatus = res.headers.get('X-Error-Status')
			const apiTime = res.headers.get('X-API-Time')
			apiError.value = !!(
				errorStatus &&
				(errorStatus.startsWith('5') || ['502', '503', '504'].includes(errorStatus))
			)
			const ms = apiTime?.match(/(\d+)ms/)?.[1]
			apiSlow.value = !!(ms && parseInt(ms) > 2000)
		} catch {
			apiError.value = false
		}
	}

	img.onerror = () => {
		loading.value = false
		generationTime.value = null
		previewSrc.value = null
		fetch(url, { method: 'HEAD' })
			.then((res) => {
				const errorStatus = res.headers.get('X-Error-Status')
				apiError.value = !!(
					errorStatus &&
					(errorStatus.startsWith('5') || ['502', '503', '504'].includes(errorStatus))
				)
			})
			.catch(() => {
				apiError.value = false
			})
	}
}

function copy(type) {
	const textMap = { markdown: markdownText.value, html: htmlText.value, url: urlText.value }
	const text = textMap[type]
	if (!text) return
	const originals = {
		markdown: t(m.actionCopyMarkdown.id),
		html: t(m.actionCopyHtml.id),
		url: t(m.actionCopyUrl.id),
	}
	navigator.clipboard.writeText(text).then(() => {
		copyLabels.value = { ...copyLabels.value, [type]: t(m.actionCopied.id) }
		setTimeout(() => {
			copyLabels.value = { ...copyLabels.value, [type]: originals[type] }
		}, 2000)
	})
}

function updateFavicon(color) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 100"><g fill="${color}" transform="translate(-195.12051,-249.04304)"><g transform="matrix(1.2138597,0,0,1.2138597,-53.114434,-63.81136)"><rect width="60" height="20" x="205.12053" y="259.04303" ry="10"/><rect width="20" height="20" x="275.12051" y="259.04303" ry="10"/><rect width="90" height="20" x="205.12053" y="319.04303" ry="10"/><rect width="90" height="20" x="204.50052" y="289.04303" ry="10"/></g></g></svg>`
	const link = document.querySelector('link[type="image/svg+xml"]')
	if (link) link.href = 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// ── Browser URL sync ──
function updateBrowserUrl() {
	const params = new URLSearchParams()
	const config = platformConfig.value
	const type = targetType.value
	const id = identifier.value.trim()

	if (selectedPlatform.value !== 'modrinth') params.set('platform', selectedPlatform.value)
	if (embedType.value !== 'card') params.set('type', embedType.value)
	params.set('target', type)
	if (badgeMetric.value !== 'downloads') params.set('metric', badgeMetric.value)
	if (id) params.set('value', id)

	if (embedType.value === 'card') {
		if (isUserLike.value && !showProjects.value) params.set('showProjects', 'false')
		if (isUserLike.value && maxProjects.value !== CARD_LIMITS.DEFAULT_COUNT)
			params.set('maxProjects', maxProjects.value)
		if (!showVersions.value) params.set('showVersions', 'false')
		if (maxVersions.value !== CARD_LIMITS.DEFAULT_COUNT)
			params.set('maxVersions', maxVersions.value)
		if (!relativeTime.value) params.set('relativeTime', 'false')
		if (!showSparklines.value) params.set('showSparklines', 'false')
		if (!showDownloadBars.value) params.set('showDownloadBars', 'false')
		if (isUserLike.value && projectTypeFilter.value) {
			if (selectedPlatform.value === 'curseforge') params.set('classId', projectTypeFilter.value)
			else params.set('projectType', projectTypeFilter.value)
		}
		if (!showBorder.value) params.set('showBorder', 'false')
		if (!animations.value) params.set('animations', 'false')
		if (selectedColor.value !== config.defaultColor) params.set('color', selectedColor.value)
		if (selectedBgColor.value !== null) params.set('backgroundColor', selectedBgColor.value)
	} else {
		if (selectedColor.value !== config.defaultColor) params.set('color', selectedColor.value)
		if (selectedBgColor.value !== null) params.set('backgroundColor', selectedBgColor.value)
		if (!showIcon.value) params.set('showIcon', 'false')
		if (!showBorder.value) params.set('showBorder', 'false')
	}

	const newUrl = params.toString()
		? `${window.location.pathname}?${params.toString()}`
		: window.location.pathname
	window.history.replaceState(null, '', newUrl)
}

function loadFromUrl() {
	const rawParams = new URLSearchParams(window.location.search)

	// Handle ?url= shortcut
	const urlParam = rawParams.get('url')
	if (urlParam) {
		urlInput.value = urlParam
		nextTick(() => onUrlInput())
		return
	}

	const platform = rawParams.get('platform') || 'modrinth'
	const config = PLATFORMS[platform]

	selectedPlatform.value = platform
	embedType.value = rawParams.get('type') || 'card'
	targetType.value = rawParams.get('target') || config.targets[0]
	badgeMetric.value = rawParams.get('metric') || 'downloads'
	identifier.value = rawParams.get('value') || ''

	projectTypeFilter.value = rawParams.get('projectType') || rawParams.get('classId') || ''

	showProjects.value = rawParams.get('showProjects') !== 'false'
	maxProjects.value = parseInt(rawParams.get('maxProjects')) || CARD_LIMITS.DEFAULT_COUNT
	showVersions.value = rawParams.get('showVersions') !== 'false'
	maxVersions.value = parseInt(rawParams.get('maxVersions')) || CARD_LIMITS.DEFAULT_COUNT
	relativeTime.value = rawParams.get('relativeTime') !== 'false'
	showSparklines.value = rawParams.get('showSparklines') !== 'false'
	showDownloadBars.value = rawParams.get('showDownloadBars') !== 'false'
	showIcon.value = rawParams.get('showIcon') !== 'false'
	showBorder.value = rawParams.get('showBorder') !== 'false'
	animations.value = rawParams.get('animations') !== 'false'
	selectedColor.value = rawParams.get('color') || config.defaultColor
	selectedBgColor.value = rawParams.get('backgroundColor') || null

	document.documentElement.style.setProperty('--platform-color', `#${config.defaultColor}`)
	updateFavicon(`#${config.defaultColor}`)

	// Auto-expand customization if URL has custom values
	const hasCustom =
		selectedColor.value !== config.defaultColor ||
		selectedBgColor.value !== null ||
		!showProjects.value ||
		maxProjects.value !== CARD_LIMITS.DEFAULT_COUNT ||
		!showVersions.value ||
		maxVersions.value !== CARD_LIMITS.DEFAULT_COUNT ||
		!relativeTime.value ||
		!showSparklines.value ||
		!showDownloadBars.value ||
		!showIcon.value ||
		!showBorder.value ||
		!animations.value

	if (hasCustom && customizationSection.value) {
		nextTick(() => {
			// The CollapsibleSection exposes expanded via ref
		})
	}

	generate()
}

onMounted(() => {
	loadFromUrl()
})
</script>
