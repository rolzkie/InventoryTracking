<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(User::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $actor = $request->attributes->get('authenticatedUser');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'manager', 'staff', 'viewer'])],
            'avatar' => ['nullable', 'string', 'max:10'],
            'department' => ['nullable', 'string', 'max:100'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if ($actor->role === 'manager' && $validated['role'] === 'admin') {
            return response()->json(['message' => 'Managers cannot create administrator accounts.'], 403);
        }

        $validated['email'] = strtolower($validated['email']);
        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $actor = $request->attributes->get('authenticatedUser');

        if ($actor->role === 'manager' && $user->role === 'admin') {
            return response()->json(['message' => 'Managers cannot modify administrator accounts.'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'role' => ['sometimes', Rule::in(['admin', 'manager', 'staff', 'viewer'])],
            'avatar' => ['nullable', 'string', 'max:10'],
            'department' => ['nullable', 'string', 'max:100'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if ($actor->role === 'manager' && ($validated['role'] ?? null) === 'admin') {
            return response()->json(['message' => 'Managers cannot promote accounts to administrator.'], 403);
        }

        if ($actor->id === $user->id && array_key_exists('active', $validated) && ! $validated['active']) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }
        if ($actor->id === $user->id && array_key_exists('role', $validated) && $validated['role'] !== $user->role) {
            return response()->json(['message' => 'You cannot change your own account role.'], 422);
        }

        if (array_key_exists('email', $validated)) {
            $validated['email'] = strtolower($validated['email']);
        }
        if (array_key_exists('password', $validated) && blank($validated['password'])) {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->fresh());
    }

    public function destroy(Request $request, User $user)
    {
        $actor = $request->attributes->get('authenticatedUser');

        if ($actor->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($actor->role === 'manager' && $user->role === 'admin') {
            return response()->json(['message' => 'Managers cannot delete administrator accounts.'], 403);
        }

        $user->delete();

        return response()->json(['ok' => true]);
    }
}
