import * as userService from "./user.service.js";
import { validateUser } from "./user.validator.js";

export const createUser = async (req, res) => {
  try {
    validateUser(req.body);

    const user = await userService.createUser(req.body);

    res.status(201).json(user);

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();

    res.json(users);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body
    );

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    const status =
      error.message?.includes("Cannot delete") ||
      error.message?.includes("cannot delete") ||
      error.message?.includes("Invalid")
        ? 400
        : 500;
    res.status(status).json({
      message: error.message
    });
  }
};