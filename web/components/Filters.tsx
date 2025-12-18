'use client';

import { useState, useEffect } from 'react';
import { SearchFilters, Student } from '@/types';
import { ChevronDownIcon, XIcon, FilterIcon, CalendarIcon, UserGroupIcon, TagIcon as TagIconOutline, AdjustmentsIcon, AcademicCapIcon } from '@heroicons/react/outline';

interface FiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

// Utility function to get tag color classes
const getTagColorClass = (tag: string): string => {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('muon')) return 'tag-muon';
  if (tagLower.includes('mup') || tagLower.includes('μp')) return 'tag-mup';
  if (tagLower.includes('shampoo')) return 'tag-shampoo';
  if (tagLower.includes('adam')) return 'tag-adam';
  if (tagLower.includes('lion')) return 'tag-lion';
  if (tagLower.includes('soap')) return 'tag-soap';
  return 'badge-tag';
};

// Normalize a homework number from a title like "HW06" or "Homework 12" to "6", "12"
const extractHomeworkNumber = (title: string): string | null => {
  if (!title) return null;
  const match = title.match(/(?:HW|Homework)\s*0*(\d+)/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return Number.isNaN(num) ? null : String(num);
};

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [homeworkNumbers, setHomeworkNumbers] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['students', 'homework', 'tags'])
  );
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    // Load students, tags, and homework numbers
    const loadData = async () => {
      try {
        const [studentsRes, tagsRes, postsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/tags'),
          fetch('/api/posts?page_size=1000')
        ]);

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setAvailableTags(tagsData);
        }

        // Extract homework numbers from posts
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          const posts = postsData.posts || [];
          const hwNumbers = new Set<string>();
          posts.forEach((post: any) => {
            const hw = extractHomeworkNumber(post.title || '');
            if (hw) {
              hwNumbers.add(hw);
            }
          });
          const sortedHwNumbers = Array.from(hwNumbers).sort(
            (a, b) => parseInt(a, 10) - parseInt(b, 10)
          );
          setHomeworkNumbers(sortedHwNumbers);
        }
      } catch (error) {
        console.error('Failed to load filter data:', error);
      }
    };

    loadData();
  }, []);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setStudentSearch('');
  };

  const hasActiveFilters = Object.keys(filters).some(key =>
    filters[key as keyof SearchFilters] !== undefined &&
    filters[key as keyof SearchFilters] !== '' &&
    !(Array.isArray(filters[key as keyof SearchFilters]) && (filters[key as keyof SearchFilters] as any[]).length === 0)
  );

  const activeFilterCount = [
    filters.student_id,
    filters.tags?.length,
    filters.has_attachments,
    filters.date_from,
    filters.date_to,
    filters.homework,
  ].filter(Boolean).length;

  const filteredStudents = students.filter(student =>
    student.display_name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Get date range presets
  const getDatePreset = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (preset) {
      case 'today':
        return { date_from: today.toISOString(), date_to: now.toISOString() };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { date_from: weekAgo.toISOString(), date_to: now.toISOString() };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { date_from: monthAgo.toISOString(), date_to: now.toISOString() };
      case 'all':
        return { date_from: undefined, date_to: undefined };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Header Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="badge bg-gray-900 text-white border-gray-900">
                {activeFilterCount}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <XIcon className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>

        {/* Date Range Presets */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Time Period</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['today', 'week', 'month', 'all'].map((preset) => (
              <button
                key={preset}
                onClick={() => updateFilters(getDatePreset(preset))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  (preset === 'all' && !filters.date_from) ||
                  (preset === 'week' && filters.date_from)
                    ? 'bg-gray-200 text-gray-900 border-2 border-gray-400'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                {preset === 'today' && 'Today'}
                {preset === 'week' && 'Last 7 days'}
                {preset === 'month' && 'Last month'}
                {preset === 'all' && 'All time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Filter */}
      <div className="card">
        <button
          onClick={() => toggleSection('students')}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-700" />
            <span className="text-base font-bold text-gray-900">Students</span>
            {filters.student_id && (
              <span className="badge badge-primary text-xs">1</span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-all ${
              expandedSections.has('students') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.has('students') && (
          <div className="mt-4 space-y-3">
            {/* Student search */}
            <input
              type="text"
              placeholder="Search students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="input text-sm"
            />

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredStudents.slice(0, 20).map((student) => (
                <label 
                  key={student.id} 
                  className={`flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                    filters.student_id === student.display_name ? 'bg-gray-100 border-2 border-gray-400' : 'border-2 border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="student"
                    value={student.display_name}
                    checked={filters.student_id === student.display_name}
                    onChange={(e) => updateFilters({
                      student_id: e.target.checked ? student.display_name : undefined
                    })}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900 flex-1">
                    {student.display_name}
                  </span>
                  {student.post_count && (
                    <span className="badge bg-gray-100 text-gray-600 text-xs">
                      {student.post_count}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Homework Filter (multi-select, checkbox list like Topics) */}
      {homeworkNumbers.length > 0 && (
        <div className="card">
          <button
            onClick={() => toggleSection('homework')}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center gap-2">
              <AcademicCapIcon className="h-5 w-5 text-gray-700" />
              <span className="text-base font-bold text-gray-900">Homework</span>
            </div>
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-all ${
                expandedSections.has('homework') ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.has('homework') && (
            <div className="mt-4">
              <div className="space-y-2">
                {homeworkNumbers.map((hwNum) => {
                  const selectedList = (filters.homework || '')
                    .split(',')
                    .filter(Boolean);
                  const isSelected = selectedList.includes(hwNum);

                  return (
                    <label
                      key={hwNum}
                      className={`flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-gray-100 border-2 border-gray-400' : 'border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const set = new Set(selectedList);
                          if (e.target.checked) {
                            set.add(hwNum);
                          } else {
                            set.delete(hwNum);
                          }
                          const next = Array.from(set).sort(
                            (a, b) => parseInt(a, 10) - parseInt(b, 10)
                          );
                          updateFilters({
                            homework: next.length > 0 ? next.join(',') : undefined,
                          });
                        }}
                        className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-900 flex-1">
                        HW {hwNum}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags Filter */}
      <div className="card">
        <button
          onClick={() => toggleSection('tags')}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-2">
            <TagIconOutline className="h-5 w-5 text-gray-700" />
            <span className="text-base font-bold text-gray-900">Topics</span>
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-all ${
              expandedSections.has('tags') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.has('tags') && (
          <div className="mt-4 space-y-2">
            {availableTags.map((tag) => (
              <label 
                key={tag} 
                className={`flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  filters.tags?.includes(tag) ? 'bg-gray-100 border-2 border-gray-400' : 'border-2 border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.tags?.includes(tag) || false}
                  onChange={(e) => {
                    const currentTags = filters.tags || [];
                    const newTags = e.target.checked
                      ? [...currentTags, tag]
                      : currentTags.filter(t => t !== tag);
                    updateFilters({ tags: newTags.length > 0 ? newTags : undefined });
                  }}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
                />
                <span className={`ml-3 badge ${getTagColorClass(tag)} border flex-1`}>
                  {tag}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Other Filters */}
      <div className="card">
        <button
          onClick={() => toggleSection('other')}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-2">
            <AdjustmentsIcon className="h-5 w-5 text-gray-700" />
            <span className="text-base font-bold text-gray-900">More Options</span>
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-all ${
              expandedSections.has('other') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.has('other') && (
          <div className="mt-4 space-y-4">
            <label className={`flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
              filters.has_attachments ? 'bg-gray-100 border-2 border-gray-400' : 'border-2 border-transparent'
            }`}>
              <input
                type="checkbox"
                checked={filters.has_attachments || false}
                onChange={(e) => updateFilters({ has_attachments: e.target.checked || undefined })}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">Has attachments</span>
            </label>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={filters.sort_by || 'newest'}
                onChange={(e) => updateFilters({ sort_by: e.target.value as any })}
                className="input text-sm"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="most_referenced">Most referenced</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
