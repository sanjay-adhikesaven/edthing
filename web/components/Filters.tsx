'use client';

import { useState, useEffect } from 'react';
import { SearchFilters, Student } from '@/types';
import { ChevronDownIcon, XIcon } from '@heroicons/react/outline';

interface FiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['students']));

  useEffect(() => {
    // Load students and tags
    const loadData = async () => {
      try {
        const [studentsRes, tagsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/tags')
        ]);

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setAvailableTags(tagsData);
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
  };

  const hasActiveFilters = Object.keys(filters).some(key =>
    filters[key as keyof SearchFilters] !== undefined &&
    filters[key as keyof SearchFilters] !== '' &&
    !(Array.isArray(filters[key as keyof SearchFilters]) && (filters[key as keyof SearchFilters] as any[]).length === 0)
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Students Filter */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('students')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-700">Students</span>
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${
              expandedSections.has('students') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.has('students') && (
          <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
            {students.map((student) => (
              <label key={student.id} className="flex items-center">
                <input
                  type="radio"
                  name="student"
                  value={student.display_name}
                  checked={filters.student_id === student.display_name}
                  onChange={(e) => updateFilters({
                    student_id: e.target.checked ? student.display_name : undefined
                  })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {student.display_name}
                  {student.post_count && (
                    <span className="text-gray-400 ml-1">({student.post_count})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Tags Filter */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('tags')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-700">Tags</span>
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${
              expandedSections.has('tags') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.has('tags') && (
          <div className="mt-2 space-y-1">
            {availableTags.map((tag) => (
              <label key={tag} className="flex items-center">
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
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{tag}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Other Filters */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('other')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-700">Other</span>
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${
              expandedSections.has('other') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.has('other') && (
          <div className="mt-2 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.has_attachments || false}
                onChange={(e) => updateFilters({ has_attachments: e.target.checked || undefined })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Has attachments</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
