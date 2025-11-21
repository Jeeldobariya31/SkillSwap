import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { User, Settings, Bell, Search, MessageSquare, Menu, Trash2, Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { logoutUser, deleteUser } from "../features/auth/authSlice";
import { toast } from "react-toastify";
import type { User as UserType } from "../types";
import { AppDispatch } from "../store";
import { unwrapResult } from "@reduxjs/toolkit";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface HeaderProps {
  currentUser: UserType | null;
  notifications: number;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, notifications }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // controlled state for mobile sheet so we can close it programmatically
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navItems = [
    { id: "/", label: "Browse Skills", icon: Search },
    { id: "/profile", label: "My Profile", icon: User },
    { id: "/swaps", label: "My Swaps", icon: MessageSquare },
  ];
  if (currentUser?.isAdmin) {
    navItems.push({ id: "/admin", label: "Admin", icon: Settings });
  }

  const handleLogout = async () => {
    try {
      const resultAction = await dispatch(logoutUser());
      unwrapResult(resultAction);
      toast.success("Logged out successfully!");
      // close mobile sheet if open
      setIsSheetOpen(false);
      navigate("/auth/login");
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to log out. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      const resultAction = await dispatch(deleteUser(currentUser._id));
      unwrapResult(resultAction);
      toast.success("Account deleted successfully.");
      // close mobile sheet and dialog only on success
      setIsSheetOpen(false);
      setIsDeleteDialogOpen(false);
      navigate("/auth/register");
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <NavLink to={"/"} className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm sm:text-lg">S</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-black">
                  SkillSwap
                </h1>
              </NavLink>
            </div>

            {currentUser ? (
              <>
                {/* Desktop Navigation */}
                <NavigationMenu className="hidden lg:flex">
                  <NavigationMenuList className="flex space-x-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavigationMenuItem key={item.id}>
                          <NavLink
                            to={item.id}
                            className={({ isActive }) =>
                              `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive
                                  ? "bg-black text-white shadow-sm"
                                  : "text-gray-700 hover:text-black hover:bg-gray-100"
                              }`
                            }
                          >
                            <Icon size={18} />
                            <span>{item.label}</span>
                          </NavLink>
                        </NavigationMenuItem>
                      );
                    })}
                  </NavigationMenuList>
                </NavigationMenu>

                {/* Desktop User Menu */}
                <div className="hidden lg:flex items-center space-x-4">
                  <Button variant="ghost" className="relative p-2">
                    <Bell size={20} />
                    {notifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 px-2 py-0.5 text-xs bg-red-500">
                        {notifications}
                      </Badge>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-3 px-4 py-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gray-100 text-gray-900">{currentUser?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-900">
                          {currentUser?.name}
                        </span>
                        {currentUser?.isAdmin && (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-900">Admin</Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu Button and Sheet */}
                <div className="lg:hidden flex items-center space-x-2">
                  <Button variant="ghost" className="relative p-2">
                    <Bell size={20} />
                    {notifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 px-1 py-0.5 text-xs bg-red-500">
                        {notifications > 9 ? '9+' : notifications}
                      </Badge>
                    )}
                  </Button>
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu size={24} />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center space-x-3 px-4 py-6 border-b border-gray-200">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gray-100 text-gray-900">{currentUser?.name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{currentUser?.name}</div>
                            {currentUser?.isAdmin && (
                              <Badge variant="secondary" className="bg-gray-200 text-gray-900">Administrator</Badge>
                            )}
                          </div>
                        </div>
                        <nav className="flex-1 px-4 py-4 space-y-2">
                          {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <NavLink
                                key={item.id}
                                to={item.id}
                                className={({ isActive }) =>
                                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isActive
                                      ? "bg-black text-white shadow-sm"
                                      : "text-gray-700 hover:text-black hover:bg-gray-100"
                                  }`
                                }
                                onClick={() => {
                                  // close the mobile sheet after navigation
                                  setIsSheetOpen(false);
                                }}
                              >
                                <Icon size={20} />
                                <span>{item.label}</span>
                              </NavLink>
                            );
                          })}
                          <Button variant="outline" className="w-full mt-4" onClick={() => { setIsSheetOpen(false); handleLogout(); }}>
                            Logout
                          </Button>
                          <Button variant="destructive" className="w-full mt-2" onClick={() => { setIsSheetOpen(false); setIsDeleteDialogOpen(true); }}>
                            Delete Account
                          </Button>
                        </nav>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button asChild variant="outline">
                  <NavLink to="/auth/login">Login</NavLink>
                </Button>
                <Button asChild>
                  <NavLink to="/auth/register">Register</NavLink>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>
              <Button variant="outline" disabled={isDeleting}>Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};