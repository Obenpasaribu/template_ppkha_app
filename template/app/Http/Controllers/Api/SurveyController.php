<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Option;
use App\Models\Question;
use App\Models\ResponseItem;
use App\Models\Survey;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * @codeCoverageIgnore
 */
class SurveyController extends Controller
{
    /**
     * Fetch all surveys with pagination
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $q = $request->input('q');

            $query = Survey::withCount('questions')->with('questions');

            if ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('title', 'ilike', "%{$q}%")
                        ->orWhere('label', 'ilike', "%{$q}%")
                        ->orWhere('kepada', 'ilike', "%{$q}%")
                        ->orWhere('dari', 'ilike', "%{$q}%");
                });
            }

            $surveys = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $surveys->items(),
                'pagination' => [
                    'total' => $surveys->total(),
                    'per_page' => $surveys->perPage(),
                    'current_page' => $surveys->currentPage(),
                    'last_page' => $surveys->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export survey structure and questions as CSV
     */
    public function export($surveyId)
    {
        try {
            $survey = Survey::with('questions.options')->findOrFail($surveyId);

            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="survey_'.$survey->id.'.csv"',
                'Pragma' => 'no-cache',
                'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
                'Expires' => '0',
            ];

            $columns = ['question_id', 'question', 'type', 'required', 'option_id', 'option_label', 'option_value'];

            $callback = function () use ($survey, $columns) {
                $file = fopen('php://output', 'w');
                
                // Add BOM for UTF-8
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
                
                fputcsv($file, $columns);

                foreach ($survey->questions as $question) {
                    if ($question->options && $question->options->count() > 0) {
                        foreach ($question->options as $option) {
                            fputcsv($file, [
                                $question->id,
                                $question->question,
                                $question->type,
                                $question->required ? '1' : '0',
                                $option->id,
                                $option->label,
                                $option->value,
                            ]);
                        }
                    } else {
                        fputcsv($file, [
                            $question->id,
                            $question->question,
                            $question->type,
                            $question->required ? '1' : '0',
                            '',
                            '',
                            '',
                        ]);
                    }
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate share token / public link for survey
     */
    public function share(Request $request, $surveyId)
    {
        try {
            $survey = Survey::findOrFail($surveyId);

            if (! $survey->share_token) {
                $survey->share_token = bin2hex(random_bytes(16));
                $survey->is_public = true;
                $survey->save();
            } else {
                // toggle public if requested
                if ($request->has('is_public')) {
                    $survey->is_public = (bool) $request->input('is_public');
                    $survey->save();
                }
            }

            $url = url('/survey/public/'.$survey->share_token);

            return response()->json([
                'success' => true,
                'data' => [
                    'share_url' => $url,
                    'share_token' => $survey->share_token,
                    'is_public' => $survey->is_public,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new survey
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'label' => 'nullable|string|max:255',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'boolean',
                'kepada' => 'nullable|string|max:255',
                'dari' => 'nullable|string|max:255',
            ]);

            $validated['created_by'] = auth()->id() ?? null;

            $survey = Survey::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Survey created successfully',
                'data' => $survey,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single survey with questions and options
     */
    public function show($id)
    {
        try {
            $survey = Survey::with(['questions' => function ($query) {
                $query->orderBy('order', 'asc');
            }, 'questions.options' => function ($query) {
                $query->orderBy('order', 'asc');
            }])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $survey,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not found',
            ], 404);
        }
    }

    /**
     * Update survey
     */
    public function update(Request $request, $id)
    {
        try {
            $survey = Survey::findOrFail($id);

            $validated = $request->validate([
                'label' => 'nullable|string|max:255',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_active' => 'boolean',
                'kepada' => 'nullable|string|max:255',
                'dari' => 'nullable|string|max:255',
            ]);

            $survey->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Survey updated successfully',
                'data' => $survey->fresh(),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Delete survey
     */
    public function destroy($id)
    {
        try {
            $survey = Survey::findOrFail($id);
            /** @var Survey $survey */
            
            // Delete dalam transaction untuk memastikan konsistensi data
            DB::transaction(function () use ($survey) {
                // Delete all related responses and items
                $survey->responses()->each(function ($response) {
                    /** @var \App\Models\SurveyResponse $response */
                    $response->items()->delete();
                    $response->delete();
                });
                
                // Delete all questions and their options
                $survey->questions()->each(function ($question) {
                    /** @var \App\Models\Question $question */
                    $question->options()->delete();
                    $question->delete();
                });
                
                // Finally delete the survey
                $survey->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Survey deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Add question to survey
     */
    public function addQuestion(Request $request, $surveyId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'label' => 'nullable|string|max:255',
                'question' => 'required|string',
                'type' => 'required|in:single,multiple,true_false,scale,text',
                'required' => 'boolean',
                'order' => 'nullable|integer',
                'options' => 'nullable|array',
                'options.*.label' => 'required|string',
                'options.*.value' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $survey = Survey::findOrFail($surveyId);

            DB::beginTransaction();
            try {
                $question = new Question([
                    'label' => $validated['label'] ?? null,
                    'question' => $validated['question'],
                    'type' => $validated['type'],
                    'required' => $validated['required'] ?? false,
                    'survey_id' => $surveyId,
                    'order' => $validated['order'] ?? ($survey->questions()->max('order') ?? 0) + 1,
                ]);
                $question->save();

                // Add options if provided
                if (!empty($validated['options'])) {
                    foreach ($validated['options'] as $idx => $opt) {
                        Option::create([
                            'question_id' => $question->id,
                            'label' => $opt['label'],
                            'value' => $opt['value'] ?? $opt['label'],
                            'order' => $idx,
                        ]);
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Question added successfully',
                    'data' => $question->load('options'),
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update question
     */
    public function updateQuestion(Request $request, $questionId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'label' => 'nullable|string|max:255',
                'question' => 'required|string',
                'type' => 'required|in:single,multiple,true_false,scale,text',
                'required' => 'boolean',
                'order' => 'nullable|integer',
                'options' => 'nullable|array',
                'options.*.id' => 'nullable|exists:options,id',
                'options.*.label' => 'required|string',
                'options.*.value' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $question = Question::findOrFail($questionId);

            DB::beginTransaction();
            try {
                $question->update([
                    'label' => $validated['label'] ?? null,
                    'question' => $validated['question'],
                    'type' => $validated['type'],
                    'required' => $validated['required'] ?? false,
                    'order' => $validated['order'] ?? $question->order,
                ]);

                // Update options if provided
                if (isset($validated['options'])) {
                    // Get existing option IDs
                    $existingIds = $question->options()->pluck('id')->toArray();
                    $submittedIds = array_filter(array_column($validated['options'], 'id'));
                    
                    // Delete options that are not in the submitted list
                    $toDelete = array_diff($existingIds, $submittedIds);
                    if (!empty($toDelete)) {
                        Option::whereIn('id', $toDelete)->delete();
                    }

                    // Update or create options
                    foreach ($validated['options'] as $idx => $opt) {
                        if (!empty($opt['id'])) {
                            // Update existing
                            Option::where('id', $opt['id'])->update([
                                'label' => $opt['label'],
                                'value' => $opt['value'] ?? $opt['label'],
                                'order' => $idx,
                            ]);
                        } else {
                            // Create new
                            Option::create([
                                'question_id' => $question->id,
                                'label' => $opt['label'],
                                'value' => $opt['value'] ?? $opt['label'],
                                'order' => $idx,
                            ]);
                        }
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Question updated successfully',
                    'data' => $question->fresh()->load('options'),
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Question not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete question
     */
    public function deleteQuestion($questionId)
    {
        try {
            $question = Question::findOrFail($questionId);
            
            DB::transaction(function () use ($question) {
                // Delete options first
                $question->options()->delete();
                
                // Delete response items
                ResponseItem::where('question_id', $question->id)->delete();
                
                // Delete question
                $question->delete();
            });

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Question not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Submit survey response
     */
    public function submitResponse(Request $request, $surveyId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'respondent_name' => 'nullable|string|max:255',
                'respondent_email' => 'nullable|email|max:255',
                'answers' => 'required|array|min:1',
                'answers.*.question_id' => 'required|exists:questions,id',
                'answers.*.option_id' => 'nullable|exists:options,id',
                'answers.*.value' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $survey = Survey::findOrFail($surveyId);

            // Validate that survey is active
            if (!$survey->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Survey is not active',
                ], 403);
            }

            // Validate required questions
            $requiredQuestions = $survey->questions()->where('required', true)->pluck('id')->toArray();
            $answeredQuestions = array_column($validated['answers'], 'question_id');
            $missingRequired = array_diff($requiredQuestions, $answeredQuestions);

            if (!empty($missingRequired)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please answer all required questions',
                    'missing_questions' => $missingRequired,
                ], 422);
            }

            DB::beginTransaction();
            try {
                $response = SurveyResponse::create([
                    'survey_id' => $surveyId,
                    'user_id' => auth()->id() ?? null,
                    'respondent_name' => $validated['respondent_name'] ?? null,
                    'respondent_email' => $validated['respondent_email'] ?? null,
                    'submitted_at' => now(),
                ]);

                foreach ($validated['answers'] as $answer) {
                    ResponseItem::create([
                        'response_id' => $response->id,
                        'question_id' => $answer['question_id'],
                        'option_id' => $answer['option_id'] ?? null,
                        'value' => $answer['value'] ?? null,
                    ]);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Response submitted successfully',
                    'data' => $response->load('items.question', 'items.option'),
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get survey responses with analytics
     */
    public function getResponses(Request $request, $surveyId)
    {
        try {
            $survey = Survey::findOrFail($surveyId);
            $perPage = $request->input('per_page', 15);

            $responses = SurveyResponse::where('survey_id', $surveyId)
                ->with(['items.option', 'items.question'])
                ->orderBy('submitted_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $responses->items(),
                'pagination' => [
                    'total' => $responses->total(),
                    'per_page' => $responses->perPage(),
                    'current_page' => $responses->currentPage(),
                    'last_page' => $responses->lastPage(),
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get survey by share token (public, no auth required)
     */
    public function showByToken($token)
    {
        try {
            $survey = Survey::where('share_token', $token)
                ->with(['questions' => function ($query) {
                    $query->orderBy('order', 'asc');
                }, 'questions.options' => function ($query) {
                    $query->orderBy('order', 'asc');
                }])
                ->firstOrFail();

            /** @var Survey $survey */

            if (!$survey->is_public) {
                return response()->json([
                    'success' => false,
                    'message' => 'Survey is not publicly shared',
                ], 403);
            }

            if (!$survey->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Survey is not active',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $survey,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get survey statistics
     */
    public function statistics($surveyId)
    {
        try {
            $survey = Survey::with('questions.options')->findOrFail($surveyId);
            /** @var Survey $survey */
            $totalResponses = SurveyResponse::where('survey_id', $surveyId)->count();

            $statistics = [];

            foreach ($survey->questions as $question) {
                $questionStats = [
                    'question_id' => $question->id,
                    'question' => $question->question,
                    'type' => $question->type,
                    'total_answers' => 0,
                ];

                if (in_array($question->type, ['single', 'multiple', 'true_false'])) {
                    $optionStats = [];
                    foreach ($question->options as $option) {
                        $count = ResponseItem::where('question_id', $question->id)
                            ->where('option_id', $option->id)
                            ->count();
                        
                        $optionStats[] = [
                            'option_id' => $option->id,
                            'label' => $option->label,
                            'count' => $count,
                            'percentage' => $totalResponses > 0 ? round(($count / $totalResponses) * 100, 2) : 0,
                        ];
                    }
                    $questionStats['options'] = $optionStats;
                    $questionStats['total_answers'] = array_sum(array_column($optionStats, 'count'));
                } else {
                    // For text and scale questions
                    $answers = ResponseItem::where('question_id', $question->id)
                        ->whereNotNull('value')
                        ->pluck('value')
                        ->toArray();
                    
                    $questionStats['total_answers'] = count($answers);
                    $questionStats['answers'] = $answers;
                }

                $statistics[] = $questionStats;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'survey' => [
                        'id' => $survey->id,
                        'title' => $survey->title,
                        'total_responses' => $totalResponses,
                    ],
                    'statistics' => $statistics,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}